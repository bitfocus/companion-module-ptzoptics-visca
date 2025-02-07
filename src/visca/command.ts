import type { CompanionOptionValues } from '@companion-module/base'
import { type Bytes, checkBytes } from '../utils/byte.js'
import { prettyBytes } from '../utils/pretty.js'

// TERMINOLOGY NOTE:
// Eight bits is a byte.  The upper or lower four-bit half of a byte is a
// nibble.  VISCA commands encode parameter values in one or more nibbles.

/**
 * Verify that the provided command bytes have the expected start byte and
 * terminator byte and contain no other terminator byte.
 */
function validateCommand(command: Bytes): void {
	checkBytes(command)

	const err = checkCommandBytes(command)
	if (err !== null) {
		throw new RangeError(err)
	}
}

/**
 * A parameter in a VISCA command to be filled in from a user-specified option,
 * consisting of the id of the option, the sequence of nibbles that constitute
 * it, and the conversion from user-specified option value to numeric value to
 * store in the VISCA command bytes.
 */
export type CommandParam = {
	readonly nibbles: readonly number[]
	readonly choiceToParam: (choice: string) => number
}

/**
 * A hash of (option id) => nibbles it's stored in and a way to convert that
 * option value to a number to store in the parameter.
 */
export type PartialCommandParams = { [key: string]: CommandParam }

/**
 * A hash of (option id) => nibbles it's stored in and a way to convert that
 * option value to a number to store in the parameter.
 */
export type CommandParams = Readonly<PartialCommandParams>

/**
 * Verify that the given parameters are internally consistent and consistent
 * against the given command.
 */
function validateCommandParams(params: CommandParams | null, command: Bytes): void {
	if (params === null) {
		return
	}

	const seen = new Set<number>()
	for (const { nibbles } of Object.values(params)) {
		if (nibbles.length === 0) {
			throw new RangeError("can't use zero nibbles to encode a parameter")
		}
		for (const nibble of nibbles) {
			if (nibble < 2 || command.length * 2 - 2 <= nibble) {
				throw new RangeError('nibble offset is out of range')
			}
			if ((command[nibble >> 1] & (nibble % 2 === 1 ? 0x0f : 0xf0)) !== 0) {
				throw new RangeError('nibble in command is nonzero')
			}
			if (seen.has(nibble)) {
				throw new RangeError('nibble appearing more than once in params')
			}
			seen.add(nibble)
		}
	}
}

/** Verify that a return message has valid format. */
function validateReturn(command: Bytes): void {
	checkBytes(command)
	if (command[0] !== 0x90) {
		throw new RangeError('return message must start with 0x90')
	}
	if (command.indexOf(0xff, 1) !== command.length - 1) {
		throw new RangeError('only 0xFF in message must be its final byte')
	}
}

/**
 * A parameter found in a response to a VISCA command, constructed from the
 * values of the specified nibbles, corresponding to a human-understandable
 * choice value by the specified function..
 */
export type ResponseParam = {
	readonly nibbles: readonly number[]
	readonly paramToChoice: (param: number) => string
}

/**
 * A hash of all parameters in a single return message.  Each key is an option
 * id, while each value identifies the nibbles that store the parameter and
 * provides a function to convert numeric parameter value to option value.
 */
export type ResponseParams = {
	readonly [key: string]: ResponseParam
}

/**
 * A single return message found within the full response to a VISCA command,
 * consisting of the given masked nibble values, with the remaining zeroed
 * nibbles corresponding to the provided list of parameters.
 */
export type Response = {
	readonly value: Bytes
	readonly mask: Bytes
	readonly params: ResponseParams
}

/**
 * Verify that the provided response is valid.  (Null corresponds to the
 * standard ACK and Completion response and so is inherently valid.)
 */
function validateResponse(response: Response): void {
	const { value, mask, params } = response
	if (value.length !== mask.length) {
		throw new RangeError('value and mask must have equal length')
	}

	validateReturn(value)
	checkBytes(mask)

	const seen = new Set<number>()
	for (const { nibbles } of Object.values(params)) {
		for (const nibble of nibbles) {
			if (nibble < 2 || value.length * 2 - 2 <= nibble) {
				throw new RangeError('nibble offset is out of range')
			}
			if ((value[nibble >> 1] & (nibble % 2 === 1 ? 0x0f : 0xf0)) !== 0) {
				throw new RangeError('nibble in value is nonzero')
			}
			if ((mask[nibble >> 1] & (nibble % 2 === 1 ? 0x0f : 0xf0)) !== 0) {
				throw new RangeError('nibble in mask is nonzero')
			}
			if (seen.has(nibble)) {
				throw new RangeError('nibble appearing more than once in params')
			}
			seen.add(nibble)
		}
	}
}

/**
 * Base class for all VISCA messages sent to a camera, both commands (no matter
 * the parameters they support) and inquiries (no matter the response expected
 * to them).
 */
export abstract class Message {
	readonly #userDefined: boolean

	/**
	 * @param userDefined
	 *    Whether this message was manually defined by the user, such that its
	 *    correctness can't be presumed -- in which case errors this message
	 *    triggers are logged but, unlike messages this module itself defines,
	 *    will not fail the connection
	 */
	constructor(userDefined: boolean) {
		this.#userDefined = userDefined
	}

	/**
	 * Whether this message was defined by the user, such that we can't expect
	 * it to process without syntax errors, unexpected responses, and the like.
	 *
	 * Errors in user-defined messages are logged, but the connection isn't put
	 * into failure state because of user mistake.  Errors in messages defined
	 * by this module don't presently put the connection into failure state, but
	 * perhaps at a future time they will be made to do so, to detect bugs in
	 * this module as quickly as possible.
	 */
	isUserDefined(): boolean {
		return this.#userDefined
	}
}

/**
 * A VISCA command that potentially contains user-specified parameters, whose
 * response consists of an ACK followed by a Completion.
 */
export abstract class Command extends Message {
	readonly #commandBytes: Bytes
	readonly #params: CommandParams | null

	/**
	 * @param commandBytes
	 *    An array of byte values that constitute this command, with any
	 *    parameter nibbles set to zero.  (For example, `81 01 04 61 0p FF` with
	 *    `p` as a parameter would use `[0x81, 0x01, 0x04, 0x61, 0x00, 0xFF]`).
	 * @param params
	 *    A hash defining all parameters to be filled in the bytes of this
	 *    command.  (`null` is equivalent to an empty hash.)  Each key is the id
	 *    of the option that encodes the parameter, and each value is an object
	 *    specifying the zero-based offsets of the nibbles that constitute the
	 *    parameter in `commandBytes` (from most to least significant) and a
	 *    function converting option values to the number to store across those
	 *    nibbles.
	 * @param userDefined
	 *    Whether this command was manually defined by the user, such that its
	 *    correctness can't be presumed -- in which case errors this command
	 *    triggers are logged but, unlike commands this module itself defines,
	 *    will not fail the connection
	 */
	constructor(commandBytes: Bytes, params: CommandParams | null, userDefined: boolean) {
		super(userDefined)

		validateCommand(commandBytes)
		this.#commandBytes = commandBytes

		validateCommandParams(params, commandBytes)
		this.#params = params
	}

	/**
	 * Compute the bytes that constitute this command, filling in any parameters
	 * in it according to the supplied option values.
	 *
	 * @param options
	 *    An options object with properties compatible with the params used to
	 *    construct this command.  `null` is permitted if this is a command with
	 *    no parameters.
	 * @returns
	 *    Bytes representing this command, with any parameters filled according
	 *    to the provided options.
	 */
	toBytes(options: CompanionOptionValues | null): Bytes {
		const commandBytes = this.#commandBytes
		const params = this.#params
		if (params === null || options === null) {
			return commandBytes
		}

		const bytes = commandBytes.slice()
		for (const [id, { nibbles, choiceToParam }] of Object.entries(params)) {
			let val = choiceToParam(String(options[id]))

			for (let i = nibbles.length; val !== 0 && i > 0; i--) {
				const nibble = nibbles[i - 1]
				const byteOffset = nibble >> 1
				const isLower = nibble % 2 === 1

				const contrib = val & 0xf
				val >>= 4

				if ((bytes[byteOffset] & (isLower ? 0xf : 0xf0)) !== 0) {
					throw new RangeError(`Error: nibble ${nibble} in [${prettyBytes(commandBytes)}] must be zero`)
				}

				bytes[byteOffset] |= contrib << (isLower ? 0 : 4)
			}
		}

		return bytes
	}
}

/**
 * A VISCA command that potentially contains user-specified parameters, whose
 * response consists of an ACK followed by a Completion.
 */
export class ModuleDefinedCommand extends Command {
	/**
	 * @param commandBytes
	 *    An array of byte values that constitute this command, with any
	 *    parameter nibbles set to zero.  (For example, `81 01 04 61 0p FF` with
	 *    `p` as a parameter would use `[0x81, 0x01, 0x04, 0x61, 0x00, 0xFF]`).
	 * @param params
	 *    A hash defining all parameters to be filled in the bytes of this
	 *    command.  (`null` is equivalent to an empty hash.)  Each key is the id
	 *    of the option that encodes the parameter, and each value is an object
	 *    specifying the zero-based offsets of the nibbles that constitute the
	 *    parameter in `commandBytes` (from most to least significant) and a
	 *    function converting option values to the number to store across those
	 *    nibbles.
	 */
	constructor(commandBytes: Bytes, params: CommandParams | null = null) {
		super(commandBytes, params, false)
	}
}

export class UserDefinedCommand extends Command {
	/**
	 * @param commandBytes
	 *    An array of byte values that constitute this command, with any
	 *    parameter nibbles set to zero.  (For example, `81 01 04 61 0p FF` with
	 *    `p` as a parameter would use `[0x81, 0x01, 0x04, 0x61, 0x00, 0xFF]`).
	 * @param params
	 *    A hash defining all parameters to be filled in the bytes of this
	 *    command.  (`null` is equivalent to an empty hash.)  Each key is the id
	 *    of the option that encodes the parameter, and each value is an object
	 *    specifying the zero-based offsets of the nibbles that constitute the
	 *    parameter in `commandBytes` (from most to least significant) and a
	 *    function converting option values to the number to store across those
	 *    nibbles.
	 */
	constructor(commandBytes: Bytes, params: CommandParams | null = null) {
		super(commandBytes, params, true)
	}
}

/**
 * A VISCA inquiry consisting of a fixed byte sequence sent to the camera, that
 * responds with a return message containing parameters specifying responses to
 * the inquiry.
 */
export abstract class Inquiry extends Message {
	readonly #commandBytes: Bytes
	readonly #response: Response

	/**
	 * @param commandBytes
	 *    An array of byte values that constitute this command, with any
	 *    parameter nibbles set to zero.  (For example, `81 01 04 61 0p FF` with
	 *    `p` as a parameter would use `[0x81, 0x01, 0x04, 0x61, 0x00, 0xFF]`).
	 * @param response
	 * 	  The structure of the expected response message to this inquiry,
	 *    including all parameters within that response.
	 * @param userDefined
	 *    Whether this command was manually defined by the user, such that its
	 *    correctness can't be presumed -- in which case errors this command
	 *    triggers are logged but, unlike commands this module itself defines,
	 *    will not fail the connection
	 */

	constructor(commandBytes: Bytes, response: Response, userDefined: boolean) {
		super(userDefined)

		validateCommand(commandBytes)
		this.#commandBytes = commandBytes

		validateResponse(response)
		this.#response = response
	}

	/** The structure of the response expected for this inquiry. */
	response(): Response {
		return this.#response
	}

	/** Compute the bytes of this inquiry. */
	toBytes(): Bytes {
		return this.#commandBytes
	}
}

export class ModuleDefinedInquiry extends Inquiry {
	constructor(commandBytes: Bytes, response: Response) {
		super(commandBytes, response, false)
	}
}

export class UserDefinedInquiry extends Inquiry {
	constructor(commandBytes: Bytes, response: Response) {
		super(commandBytes, response, true)
	}
}

/**
 * Check whether the bytes of VISCA response `response`, when masked, equal
 * those of `values`.
 */
export function responseMatches(response: Bytes, mask: Bytes, values: Bytes): boolean {
	if (response.length !== values.length) return false
	for (let i = 0; i < response.length; i++) {
		if ((response[i] & mask[i]) !== values[i]) return false
	}
	return true
}

/**
 * Check the bytes of a VISCA command for envelope validity.
 *
 * @returns null if the bytes are valid, an error message string if not
 */
export function checkCommandBytes(bytes: Bytes): string | null {
	if (bytes.length === 0) {
		return 'command must not be empty'
	}

	// VISCA was first developed by Sony, then ad-hoc implemented by other
	// camera vendors.  There doesn't appear to be a standardized message
	// format, even as simple as defining the message start/end bytes.  But
	// these assertions presently hold against PTZ Optics's documented VISCA
	// commands, and if command start/end weren't delimited as required here,
	// it's hard to say what series of sent bytes a camera response indicating a
	// syntax error (90 60 02 FF) would apply to.

	if (bytes[0] !== 0x81) {
		// VISCA generally says the first byte is 8x, where x encodes the
		// particular camera to which the command applies when cameras are
		// connected in series.  But PTZOptics VISCA over TCP forces x=1.
		return 'first byte in command must be 0x81'
	}

	const idx = bytes.indexOf(0xff, 1)
	if (idx < 0) {
		return 'command must end in 0xFF'
	}
	if (idx !== bytes.length - 1) {
		return 'command must not contain embedded 0xFF'
	}

	return null
}
