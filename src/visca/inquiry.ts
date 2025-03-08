import { Message, MessageDelimiter } from './message.js'
import { checkBytes, type Bytes, type Nibbles } from '../utils/byte.js'
import { prettyByte, prettyBytes } from '../utils/pretty.js'

/**
 * Convert a parameter's numeric value to a semantic representation of that
 * value, for example convert `0` and `1` to `'off'` and `'on'`.  (Actual
 * conversion functions usually will convert to a narrower type than `any`.)
 */
type ToSemanticValue = (param: number) => any

/**
 * The unvalidated specification of the parameters in an answer and how their
 * numeric values are converted to usable parameter type.
 */
export type AnswerParameters = Record<
	string,
	{
		/** The nibbles, in big-endian order, that form this parameter. */
		readonly nibbles: readonly number[]

		/**
		 * If supplied, a conversion function for the parameter.  If missing,
		 * the parameter's numeric value is its semantic value.
		 */
		readonly convert?: ToSemanticValue
	}
>

/**
 * A command parameter specification identical to `CommandParameters`, but with
 * the further restriction that nibbles lists are constrained to be nonempty.
 */
type ModuleAnswerParameters = AnswerParameters & Record<string, { readonly nibbles: Nibbles }>

/**
 * The nibbles that constitute a particular answer parameter and a means of
 * converting the parameter's numeric value to its semantic representation (e.g.
 * converting `0` and `1` to `'off'` and `'on'`).
 */
class AnswerParam<Convert extends ToSemanticValue> {
	/**
	 * The distinct nibbles that constitute this parameter, in big-endian order.
	 * These nibbles are distinct from all other parameter nibbles in the
	 * corresponding fully-defined answer.
	 */
	nibbles: Nibbles

	/**
	 * A conversion function for the parameter.  If `null`, the parameter's
	 * numeric value is its semantic value.
	 */
	convert: Convert | null

	/**
	 * Enforce deliberate construction of `AnswerParameter`, rather than
	 * permitting accidental construction by object literal, by adding a private
	 * named property that only this constructor can initialize.
	 */
	#preventNominal

	constructor(nibbles: Nibbles, convert: Convert | null) {
		this.nibbles = nibbles
		this.convert = convert

		this.#preventNominal = true
		void this.#preventNominal
	}
}

/**
 * A hash of all parameters in a single answer message, where each key is a
 * parameter identifier and each value defines the parameter, identifying the
 * nibbles that constitute it in big-endian order and defining a function to
 * convert from parameter numeric value to semantic representation.
 *
 * This class consists only of validated parameter information.  (That is, all
 * identified nibbles are distinct and within the proper range for the
 * associated answer bytes.)
 */
type AnswerParams<ParamTypes extends AnswerParameters> = {
	[Param in keyof ParamTypes]: Readonly<
		AnswerParam<
			ParamTypes[Param]['convert'] extends ToSemanticValue ? ParamTypes[Param]['convert'] : (param: number) => number
		>
	>
}

const AnswerInitialByte = 0x90

/**
 * The bytes that constitute the answer message for some inquiry, with all
 * nibbles contained within parameters set to zero.
 */
type AnswerBytes = readonly [typeof AnswerInitialByte, ...Bytes, 0xff]

/** The possible values of each mask byte in an inquiry answer. */
type MaskByte = 0x00 | 0xf0 | 0x0f | 0xff

/**
 * Mask bytes for the answer message for some inquiry, that match all nibbles
 * that aren't part of parameters in the answer message while zeroing out all
 * nibbles that are part of parameters.
 */
type AnswerMask = readonly [0xff, ...MaskByte[], 0xff]

/**
 * The answer to some VISCA inquiry, consisting of the given bytes, with a mask
 * that erases all parameters from the return message masked
 * nibble values, with the remaining zeroed nibbles corresponding to the provided
 * parameters.
 *
 * Instances of this class represent a fully validated return structure: the
 * bytes of the inquiry return message start with the appropriate byte value and
 * are terminated only at their end, and all nibble values refer to distinct
 * unmasked nibbles within the return message.
 */
export class AnswerMessage<AnsParameters extends AnswerParameters> {
	/**
	 * The expected bytes of a return message.  All nibbles that are contained
	 * within parameters are zeroed.
	 */
	readonly bytes: AnswerBytes
	readonly mask: AnswerMask
	readonly params: Readonly<AnswerParams<AnsParameters>>

	constructor(bytes: AnswerBytes, params: AnsParameters) {
		this.bytes = bytes

		const { length } = bytes

		const validParams: Partial<AnswerParams<AnsParameters>> = {}

		// The mask initially preserves every nibble, then nibbles are removed
		// as they're encountered.
		const mask = new Array<number>(length).fill(0xff)

		const Start = 2
		const Limit = length * 2 - 2
		for (const [id, { nibbles, convert }] of Object.entries(params)) {
			if (nibbles.length < 1) {
				throw new RangeError(`parameter ${id} nibble list must not be empty`)
			}
			for (const nibble of nibbles) {
				if (nibble < Start || Limit <= nibble) {
					throw new RangeError(`nibble ${nibble} for parameter ${id} is out of range`)
				}
				if ((bytes[nibble >> 1] & (nibble % 2 === 1 ? 0x0f : 0xf0)) !== 0) {
					throw new RangeError(`nibble ${nibble} in answer message bytes ${prettyBytes(bytes)} is nonzero`)
				}

				const nibbleByte = mask[nibble >> 1]
				const nibbleMask = nibble % 2 === 1 ? 0x0f : 0xf0
				if ((nibbleByte & nibbleMask) === 0) {
					throw new RangeError(`nibble ${nibble} appears multiple times in ${id} parameter nibble list`)
				}
				mask[nibble >> 1] = nibbleByte & ~nibbleMask
			}

			validParams[id as keyof typeof params] = new AnswerParam(nibbles as Nibbles, convert || null)
		}

		this.mask = mask as readonly number[] as AnswerMask
		this.params = validParams as AnswerParams<AnsParameters>
	}

	static validateAnswerBytes(bytes: Bytes): AnswerBytes {
		if (bytes.length < 2) {
			throw new RangeError('answer message not long enough')
		}

		checkBytes(bytes)

		if (bytes[0] !== AnswerInitialByte) {
			throw new RangeError(`answer message must begin with ${prettyByte(AnswerInitialByte)}`)
		}

		const delimiterIndex = bytes.indexOf(MessageDelimiter, 1)
		if (delimiterIndex < 0) {
			throw new RangeError(`answer message must contain a ${prettyByte(MessageDelimiter)} delimiter`)
		}
		if (delimiterIndex !== bytes.length - 1) {
			throw new RangeError(`answer message must end in a ${prettyByte(MessageDelimiter)} delimiter`)
		}

		return bytes as AnswerBytes
	}
}

/**
 * The initial byte of a valid inquiry.  (This is generically `8x`, but
 * PTZOptics VISCA over TCP/IP restricts it to `x=1`, and no one has expended
 * the effort required to support `x≠1`.)
 */
const InquiryInitialByte = 0x81

type InquiryBytes = readonly [typeof InquiryInitialByte, ...Bytes, 0xff]

/**
 * A VISCA inquiry consisting of a fixed byte sequence sent to the camera, that
 * responds with a return message containing parameters specifying responses to
 * the inquiry.
 */
export abstract class Inquiry<AnsParameters extends AnswerParameters> extends Message {
	readonly #inquiryBytes: InquiryBytes
	readonly #answer: AnswerMessage<AnsParameters>

	/**
	 * @param inquiryBytes
	 *    The bytes that constitute this inquiry.
	 * @param answerMessage
	 *    The structure of the expected response message to this inquiry,
	 *    including all parameters within that response.
	 * @param userDefined
	 *    Whether this inquiry was manually defined by the user, such that its
	 *    correctness can't be presumed -- in which case errors this inquiry
	 *    triggers are logged but, unlike inquiries this module itself defines
	 *    (presumptively correctly), will not fail the connection.
	 */
	constructor(inquiryBytes: InquiryBytes, answerMessage: AnswerMessage<AnsParameters>, userDefined: boolean) {
		super(userDefined)
		this.#inquiryBytes = inquiryBytes
		this.#answer = answerMessage
	}

	/** The structure of the answer expected for this inquiry. */
	answer(): AnswerMessage<AnsParameters> {
		return this.#answer
	}

	/** Compute the bytes of this inquiry. */
	toBytes(): InquiryBytes {
		return this.#inquiryBytes
	}
}

/**
 * A VISCA inquiry with bytes and expected answer format defined internal to
 * this module, so that unexpected behavior can be considered a fatal error.
 */
export class ModuleDefinedInquiry<Parameters extends ModuleAnswerParameters> extends Inquiry<Parameters> {
	constructor(inquiry: InquiryBytes, { bytes, params }: { bytes: AnswerBytes; params: Parameters }) {
		super(inquiry, new AnswerMessage(bytes, params), false)
	}
}

function toInquiryBytes(bytes: Bytes): InquiryBytes {
	if (bytes.length < 2) {
		throw new RangeError(`inquiries are multiple bytes in length`)
	}

	checkBytes(bytes)

	if (bytes[0] !== InquiryInitialByte) {
		throw new RangeError(`inquiry must start with ${prettyByte(InquiryInitialByte)}`)
	}

	const delimiterIndex = bytes.indexOf(MessageDelimiter, 1)
	if (delimiterIndex < 0) {
		throw new RangeError(`inquiry must contain a ${prettyByte(MessageDelimiter)} delimiter`)
	}
	if (delimiterIndex !== bytes.length - 1) {
		throw new TypeError(`inquiry must end with ${prettyByte(MessageDelimiter)}`)
	}

	return bytes as InquiryBytes
}

/**
 * A VISCA inquiry with user-specified bytes and expected response format, such
 * that an error encountered sending the inquiry will not be considered fatal.
 */
export class UserDefinedInquiry<Parameters extends AnswerParameters> extends Inquiry<Parameters> {
	constructor(inquiry: Bytes, { bytes, params }: { bytes: Bytes; params: Parameters }) {
		const answerMessageBytes = AnswerMessage.validateAnswerBytes(bytes)
		super(toInquiryBytes(inquiry), new AnswerMessage(answerMessageBytes, params), true)
	}
}

/**
 * A type exposing the numeric values of the parameters in the answer to an
 * inquiry.
 */
export type Answer<Parameters extends AnswerParameters> = {
	[K in keyof Parameters]: Parameters[K]['convert'] extends (param: number) => any
		? ReturnType<Parameters[K]['convert']>
		: number
}
