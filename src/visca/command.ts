import { checkBytes, prettyBytes } from './utils.js'

// TERMINOLOGY NOTE:
// Eight bits is a byte.  The upper or lower four-bit half of a byte is a
// nibble.  VISCA commands encode parameter values in one or more nibbles.

/**
 * Verify that the provided command bytes have the expected start byte and
 * terminator byte and contain no other terminator byte.
 */
function validateCommand(command: readonly number[]): void {
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
function validateCommandParams(params: CommandParams | null, command: readonly number[]): void {
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
function validateReturn(command: readonly number[]): void {
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
	[key: string]: ResponseParam
}

/**
 * A single return message found within the full response to a VISCA command,
 * consisting of the given masked nibble values, with the remaining zeroed
 * nibbles corresponding to the provided list of parameters.
 */
export type Response = {
	readonly value: readonly number[]
	readonly mask: readonly number[]
	readonly params: ResponseParams
}

/**
 * Verify that the provided response is valid.  (Null corresponds to the
 * standard ACK and Completion response and so is inherently valid.)
 */
function validateResponse(response: readonly Response[] | null): void {
	if (response === null) return

	for (const { value, mask, params } of response) {
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
}

/**
 * A command, potentially including user-provided parameters, that's expected to
 * complete successfully, returning a response having the indicated structure,
 * each return message within it potentially including parameters.
 */
export class Command {
	readonly #commandBytes: readonly number[]
	readonly #params: CommandParams | null
	readonly #response: readonly Response[] | null
	readonly #userDefined: boolean

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
	 * @param response
	 *    If null, indicates that the command expects the standard ACK followed
	 *    by a Completion response.  Otherwise an array defining the expected
	 *    order and structure of one or more response messages constituting a
	 *    complete response to this command.  Each array element corresponds to
	 *    a command in the overall response.  The 'value' property is an array
	 *    of byte values for the command, with variable bits set to zero.  The
	 *    'mask' property' is an array of byte masks equal in length to the
	 *    'value' array, with bits set corresponding to the bits in the 'value'
	 *    array that cannot vary.  The 'params' property is a hash whose keys
	 *    name the parameters in the message and whose values define the nibbles
	 *    constituting it and the manner of converting parameter numeric values
	 *    to the values of options corresponding to that key.
	 * @param userDefined
	 *    Whether this command was manually defined by the user, such that its
	 *    correctness can't be presumed -- in which case errors this command
	 *    triggers are logged but, unlike commands this module itself defines,
	 *    will not fail the connection
	 */
	constructor(
		commandBytes: readonly number[],
		params: CommandParams | null,
		response: readonly Response[] | null,
		userDefined: boolean
	) {
		validateCommand(commandBytes)
		this.#commandBytes = commandBytes

		validateCommandParams(params, commandBytes)
		this.#params = params

		validateResponse(response)
		this.#response = response

		this.#userDefined = userDefined
	}

	/**
	 * Compute the bytes that constitute this command, filling in parameters
	 * according to the supplied option values.
	 *
	 * @param options
	 *    An options object with properties compatible with the params used to
	 *    construct this.  `null` is permitted when this command has no
	 *    parameters.
	 * @returns
	 *    Bytes representing this command, with parameters filled according to
	 *    the provided options.  The returned array must not be modified.
	 */
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- need to figure out how to sync up options object with command parameters
	toBytes(options: any /* CompanionOptionValues | null */): readonly number[] {
		const commandBytes = this.#commandBytes
		const params = this.#params
		if (params === null) {
			return commandBytes
		}

		const bytes = commandBytes.slice()
		for (const [id, { nibbles, choiceToParam }] of Object.entries(params)) {
			let val = choiceToParam(options[id])

			for (let i = nibbles.length; val !== 0 && i > 0; i--) {
				const nibble = nibbles[i - 1]
				const byteOffset = nibble >> 1
				const isLower = nibble % 2 == 1

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

	/**
	 * Characteristics of the expected response to this command, or null if the
	 * expected response is an ACK followed by a Completion.
	 */
	response(): readonly Response[] | null {
		return this.#response
	}

	/**
	 * Whether this command was defined by the user, such that we can't expect
	 * it to execute without syntax errors, unexpected responses, and the like.
	 * Errors in user-defined commands are logged, but the connection isn't put
	 * into failure state because of user mistake -- whereas for errors with
	 * commands defined by this module, we fail the connection so that bugs will
	 * be discovered and reported as quickly as possible.
	 */
	isUserDefined(): boolean {
		return this.#userDefined
	}
}

/**
 * A command defined wholly within this module (as opposed to a command that's
 * defined by the user as a custom command), potentially including user-provided
 * parameters, that's expected to complete successfully, returning a response
 * having the indicated structure, each return message within it potentially
 * including parameters.
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
	 * @param response
	 *    If null, indicates that the command expects the standard ACK followed
	 *    by a Completion response.  Otherwise an array defining the expected
	 *    order and structure of one or more response messages constituting a
	 *    complete response to this command.  Each array element corresponds to
	 *    a command in the overall response.  The 'value' property is an array
	 *    of byte values for the command, with variable bits set to zero.  The
	 *    'mask' property' is an array of byte masks equal in length to the
	 *    'value' array, with bits set corresponding to the bits in the 'value'
	 *    array that cannot vary.  The 'params' property is a hash whose keys
	 *    name the parameters in the message and whose values define the nibbles
	 *    constituting it and the manner of converting parameter numeric values
	 *    to the values of options corresponding to that key.
	 */
	constructor(
		commandBytes: readonly number[],
		params: CommandParams | null = null,
		response: readonly Response[] | null = null
	) {
		super(commandBytes, params, response, false)
	}
}

/**
 * A command  defined by the user as a custom command, potentially including
 * user-provided parameters, that's expected to complete successfully, returning
 * a response having the indicated structure, each return message within it
 * potentially including parameters.
 */
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
	 * @param response
	 *    If null, indicates that the command expects the standard ACK followed
	 *    by a Completion response.  Otherwise an array defining the expected
	 *    order and structure of one or more response messages constituting a
	 *    complete response to this command.  Each array element corresponds to
	 *    a command in the overall response.  The 'value' property is an array
	 *    of byte values for the command, with variable bits set to zero.  The
	 *    'mask' property' is an array of byte masks equal in length to the
	 *    'value' array, with bits set corresponding to the bits in the 'value'
	 *    array that cannot vary.  The 'params' property is a hash whose keys
	 *    name the parameters in the message and whose values define the nibbles
	 *    constituting it and the manner of converting parameter numeric values
	 *    to the values of options corresponding to that key.
	 */
	constructor(
		commandBytes: readonly number[],
		params: CommandParams | null = null,
		response: readonly Response[] | null = null
	) {
		super(commandBytes, params, response, true)
	}
}

/**
 * Check whether the bytes of VISCA response `response` are equal to `values`.
 */
export function responseIs(response: readonly number[], values: readonly number[]): boolean {
	if (response.length !== values.length) return false
	for (let i = 0; i < response.length; i++) {
		if (response[i] !== values[i]) return false
	}
	return true
}

/**
 * Check whether the bytes of VISCA response `response`, when masked, equal
 * those of `values`.
 */
export function responseMatches(
	response: readonly number[],
	mask: readonly number[],
	values: readonly number[]
): boolean {
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
export function checkCommandBytes(bytes: readonly number[]): string | null {
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
