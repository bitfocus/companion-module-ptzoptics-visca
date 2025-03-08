import { Message, MessageDelimiter } from './message.js'
import type { Bytes, Nibbles } from '../utils/byte.js'
import { prettyByte, prettyBytes } from '../utils/pretty.js'
import { repr } from '../utils/repr.js'

/**
 * Convert the semantic representation of a parameter to its numeric value.  For
 * example convert `'off'` and `'on'` to `0` and `1`.  (Actual conversion
 * functions usually will convert from a narrower type than `any`.)
 */
type ToParameterValue = (val: any) => number

/**
 * The unvalidated specification of the parameters in a command and how the
 * semantic representation of the parameter is converted to a numeric value for
 * insertion in the command.
 *
 * For example, the Pan Tilt: Pan Tilt Limit: LimitSet command (used to set the
 * upper-right and lower-left pan/tilt positions, to restrict panning within a
 * particular range) is `81 01 06 07 00 0w 0y 0y 0y 0y 0z 0z 0z 0z FF`, where
 * `w=1` to set the upper-right limit or `w=0` to set the lower-left limit, and
 * `yyyy` is a pan limit position and `zzzz` is a tilt limit position.  This
 * could be represented in this fashion:
 *
 * ```typescript
 * const LimitSetParameters = {
 *     corner: {
 *         nibbles: [11],
 *         convert: (val: 'upper-right' | 'lower-left'): number => {
 *             switch (val) {
 *                  case 'upper-right': return 1
 *                  case 'lower-left': return 2
 *                  default: throw new RangeError(`invalid corner: ${val}`)
 *             }
 *         }
 *     },
 *     panLimit: {
 *         nibbles: [13, 15, 17, 19],
 *         // semantic value is numeric value, no conversion needed
 *     },
 *     tiltLimit: {
 *         nibbles: [21, 23, 25, 27],
 *         // semantic value is numeric value, no conversion needed
 *     },
 * }
 * ```
 *
 * and then the command could be sent with parameters such as
 *
 * ````typescript
 * const commandParams = {
 *     corner: 'upper-right',
 *     panLimit: 0x1234,
 *     tiltLimit: 0x5678,
 * }
 * ````
 */
export type CommandParameters = Record<
	string,
	{
		/** The nibbles, in big-endian order, that form this parameter. */
		readonly nibbles: readonly number[]

		/**
		 * If supplied, a conversion function for the parameter.  If missing,
		 * the parameter's semantic and numeric values are the same number.
		 */
		readonly convert?: ToParameterValue
	}
>

/** A command parameter specification for a command with no parameters. */
export type NoCommandParameters = Record<string, never>

/**
 * A command parameter specification identical to `CommandParameters`, but with
 * the further restriction that nibbles lists are constrained to be nonempty.
 */
type ModuleCommandParameters = Record<
	string,
	{
		/** The nibbles, in big-endian order, that form this parameter. */
		readonly nibbles: Nibbles

		/**
		 * If supplied, a conversion function for the parameter.  If missing,
		 * the parameter's semantic and numeric values are the same number.
		 */
		readonly convert?: ToParameterValue
	}
>

/**
 * The nibbles that constitute a particular command parameter and a means of
 * converting the parameter's semantic representation to its numeric value (e.g.
 * converting `'off'` and `'on'` to `0` and `1`).
 */
class CommandParam<Convert extends ToParameterValue> {
	/**
	 * The distinct nibbles that constitute this parameter, in big-endian order.
	 * These nibbles are distinct from all other parameter nibbles in the
	 * corresponding fully-defined answer.
	 */
	nibbles: Nibbles

	/**
	 * A conversion function for the parameter.  If `null`, the parameter's
	 * semantic value is its numeric value.
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
 * A hash of all parameters in a single command, where each key is a parameter
 * identifier and each value defines the parameter, identifying the nibbles that
 * constitute it in big-endian order and defining a function to convert from
 * semantic representation to parameter numeric value.
 *
 * This class consists only of validated parameter information.  (That is, all
 * identified nibbles are distinct and within the proper range for the
 * associated command bytes.)
 */
type CommandParams<ParamTypes extends CommandParameters> = {
	[Param in keyof ParamTypes]: Readonly<
		CommandParam<
			ParamTypes[Param]['convert'] extends ToParameterValue ? ParamTypes[Param]['convert'] : (val: number) => number
		>
	>
}

const CommandInitialByte = 0x81

/**
 * The bytes that constitute some particular command, with all nibbles contained
 * within parameters set to zero.
 */
type CommandBytes = readonly [typeof CommandInitialByte, ...Bytes, 0xff]

/**
 * Command parameters as specified when sending a command, with parameter values
 * encoded using the pre-conversion type of each parameter, per the argument to
 * the specified conversion function (if one is supplied; otherwise the
 * parameter's numeric value is used instead).
 */
export type CommandParamValues<CmdParameters extends CommandParameters> = {
	[K in keyof CmdParameters]: CmdParameters[K]['convert'] extends ToParameterValue
		? Parameters<CmdParameters[K]['convert']>[0]
		: number
}

function toCommandBytes(bytes: Bytes): CommandBytes {
	if (bytes.length === 0) {
		throw new RangeError('command must not be empty')
	}

	// VISCA was first developed by Sony, then ad-hoc implemented by other
	// camera vendors.  There doesn't appear to be a standardized message
	// format, even as simple as defining the message start/end bytes.  But
	// these assertions presently hold against PTZ Optics's documented VISCA
	// commands, and if command start/end weren't delimited as required here,
	// it's hard to say what series of sent bytes a camera response indicating a
	// syntax error (90 60 02 FF) would apply to.

	if (bytes[0] !== CommandInitialByte) {
		// VISCA generally says the first byte is 8x, where x encodes the
		// particular camera to which the command applies when cameras are
		// connected in series.  But PTZOptics VISCA over TCP forces x=1.
		throw new RangeError('first byte in command must be 0x81')
	}

	const idx = bytes.indexOf(MessageDelimiter, 1)
	if (idx < 0) {
		throw new RangeError(`command must end in ${prettyByte(MessageDelimiter)}`)
	}
	if (idx !== bytes.length - 1) {
		throw new RangeError(`command must not contain embedded ${prettyByte(MessageDelimiter)}`)
	}

	return bytes as CommandBytes
}

/**
 * A VISCA command that potentially contains user-specified parameters, whose
 * response consists of an ACK followed by a Completion.
 */
export abstract class Command<CmdParameters extends CommandParameters> extends Message {
	readonly #bytes: CommandBytes
	readonly #parameters: CommandParams<CmdParameters> | null

	/**
	 * @param bytes
	 *    The bytes that constitute this command, with any parameter nibbles set
	 *    to zero.  (For example, `81 01 04 61 0p FF` with `p` as a parameter
	 *    would use `[0x81, 0x01, 0x04, 0x61, 0x00, 0xFF]`).
	 * @param userDefined
	 *    Whether this command was manually defined by the user, such that its
	 *    correctness can't be presumed -- in which case errors this command
	 *    triggers are logged but, unlike commands this module itself defines,
	 *    will not fail the connection
	 * @param params
	 *    Parameter information for the command.  This may be omitted for
	 *    commands that don't have any parameters.
	 */
	constructor(
		bytes: CommandBytes,
		userDefined: boolean,
		...params: CmdParameters extends NoCommandParameters ? [CmdParameters?] : [CmdParameters]
	) {
		super(userDefined)

		this.#bytes = bytes

		const parameters = params[0]
		if (parameters === undefined) {
			this.#parameters = null
		} else {
			const validParams: Partial<CommandParams<CmdParameters>> = {}

			const seen = new Set<number>()
			const Start = 2
			const Limit = bytes.length * 2 - 2
			for (const [id, { nibbles, convert }] of Object.entries(parameters)) {
				if (nibbles.length === 0) {
					throw new RangeError(`Parameter ${id} must occupy at least one nibble`)
				}
				for (const nibble of nibbles) {
					if (nibble < Start || Limit <= nibble) {
						throw new RangeError(`Parameter ${id} nibble ${nibble} isn't between the first and last bytes`)
					}
					if ((bytes[nibble >> 1] & (nibble % 2 === 1 ? 0x0f : 0xf0)) !== 0) {
						throw new RangeError(`Parameter ${id} nibble ${nibble} in ${prettyBytes(bytes)} must be zero`)
					}
					if (seen.has(nibble)) {
						throw new RangeError(`Parameter ${id} nibble ${nibble} can't be used multiple times in parameters`)
					}
					seen.add(nibble)
				}

				validParams[id as keyof CmdParameters] = new CommandParam(nibbles as Nibbles, convert || null)
			}

			this.#parameters = validParams as CommandParams<CmdParameters>
		}
	}

	static validateCommandBytes(bytes: Bytes): CommandBytes {
		if (bytes.length === 0) {
			throw new RangeError('command must not be empty')
		}

		// VISCA was first developed by Sony, then ad-hoc implemented by other
		// camera vendors.  There doesn't appear to be a standardized message
		// format, even as simple as defining the message start/end bytes.  But
		// these assertions presently hold against PTZ Optics's documented VISCA
		// commands, and if command start/end weren't delimited as required here,
		// it's hard to say what series of sent bytes a camera response indicating a
		// syntax error (90 60 02 FF) would apply to.

		if (bytes[0] !== CommandInitialByte) {
			// VISCA generally says the first byte is 8x, where x encodes the
			// particular camera to which the command applies when cameras are
			// connected in series.  But PTZOptics VISCA over TCP forces x=1.
			throw new RangeError('first byte in command must be 0x81')
		}

		const idx = bytes.indexOf(MessageDelimiter, 1)
		if (idx < 0) {
			throw new RangeError(`command must end in ${prettyByte(MessageDelimiter)}`)
		}
		if (idx !== bytes.length - 1) {
			throw new RangeError(`command must not contain embedded ${prettyByte(MessageDelimiter)}`)
		}

		return bytes as CommandBytes
	}

	/**
	 * Compute the bytes that constitute this command, filling in any parameters
	 * in it according to the supplied option values.
	 *
	 * @param paramValues
	 *    An object mapping all parameter ids to their semantic values.
	 * @returns
	 *    Bytes representing this command, with any parameters filled according
	 *    to the provided options.
	 */
	toBytes(
		...paramValues: CmdParameters extends NoCommandParameters
			? [Readonly<CommandParamValues<CmdParameters>>?]
			: [Readonly<CommandParamValues<CmdParameters>>]
	): Bytes {
		const commandBytes = this.#bytes
		const paramVals = paramValues[0]
		if (paramVals === undefined) {
			return commandBytes
		}

		const entries = Object.entries(paramVals)
		if (entries.length === 0) {
			return commandBytes
		}

		const commandParams = this.#parameters
		if (commandParams === null) {
			return commandBytes
		}

		const bytes = commandBytes.slice()
		for (const entry of Object.entries(paramVals)) {
			const [id, semantic] = entry
			const { nibbles, convert } = commandParams[id]

			let numeric = convert ? convert(semantic) : semantic
			if (typeof numeric !== 'number') {
				// tsc seems to think that `semantic` is always a number and
				// that `convert` is always `(val: number) => number`.  But this
				// is wrong, and it looks like it might be inference gone amok.
				// Double-check the types for sanity.
				throw new TypeError(`Error: failed to compute a numeric value for parameter ${id} from value ${repr(semantic)}`)
			}

			for (let i = nibbles.length; numeric !== 0 && i > 0; i--) {
				const nibble = nibbles[i - 1]
				const byteOffset = nibble >> 1
				const isLower = nibble % 2 === 1

				const contrib = numeric & 0xf
				numeric >>= 4

				if ((bytes[byteOffset] & (isLower ? 0xf : 0xf0)) !== 0) {
					throw new RangeError(`Error: nibble ${nibble} in ${prettyBytes(commandBytes)} must be zero`)
				}

				bytes[byteOffset] |= contrib << (isLower ? 0 : 4)
			}
		}

		return bytes
	}
}

/**
 * A VISCA command with bytes and parameters are defined internal to this
 * module, whose response consists of an ACK followed by a Completion.
 */
export class ModuleDefinedCommand<
	CmdParameters extends ModuleCommandParameters = NoCommandParameters,
> extends Command<CmdParameters> {
	/**
	 * @param bytes
	 *    The bytes that constitute this command, with any parameter nibbles set
	 *    to zero.  (For example, `81 01 04 61 0p FF` with `p` as a parameter
	 *    would use `[0x81, 0x01, 0x04, 0x61, 0x00, 0xFF]`).
	 * @param params
	 *    Parameter information about all parameters in the command.  If the
	 *    command lacks parameters, this may be omitted.  See
	 *    `CommandParameters` for what the argument passed here should look
	 *    like.
	 */
	constructor(
		bytes: CommandBytes,
		...params: CmdParameters extends NoCommandParameters ? [CmdParameters?] : [CmdParameters]
	) {
		super(bytes, false, ...params)
	}
}

/**
 * A VISCA command that potentially contains user-specified parameters, whose
 * response consists of an ACK followed by a Completion.
 */
export class UserDefinedCommand<
	CmdParameters extends CommandParameters = NoCommandParameters,
> extends Command<CmdParameters> {
	/**
	 * @param bytes
	 *    The bytes that constitute this command, with any parameter nibbles set
	 *    to zero.  (For example, `81 01 04 61 0p FF` with `p` as a parameter
	 *    would use `[0x81, 0x01, 0x04, 0x61, 0x00, 0xFF]`).
	 * @param params
	 *    Parameter information about all parameters in the command.  If the
	 *    command lacks parameters, this may be omitted.  See
	 *    `CommandParameters` for what the argument passed here should look
	 *    like.
	 */
	constructor(bytes: Bytes, ...params: CmdParameters extends NoCommandParameters ? [CmdParameters?] : [CmdParameters]) {
		super(toCommandBytes(bytes), true, ...params)
	}
}
