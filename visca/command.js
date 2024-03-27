import { checkBytes, prettyBytes } from './utils.js'

// TERMINOLOGY NOTE:
// Eight bits is a byte.  The upper or lower four-bit half of a byte is a
// nibble.  VISCA commands encode parameter values in one or more nibbles.

/**
 * Verify that the provided command bytes have the expected start byte and
 * terminator byte and contain no other terminator byte.
 *
 * @param {number[]} command
 */
function validateCommand(command) {
	checkBytes(command)

	const err = checkCommandBytes(command)
	if (err !== null) {
		throw new RangeError(err)
	}
}

/**
 * Verify that the given parameters are internally consistent and consistent
 * against the given command.
 *
 * @param {?Object.<string, { nibbles: number[], choiceToParam: (choice: string) => number }>} params
 * @param {number[]} command
 */
function validateCommandParams(params, command) {
	if (params === null) {
		return
	}

	/** @type {Set<number>} */
	const seen = new Set()
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

/**
 * Verify that a return message has valid format.
 *
 * @param {number[]} command
 */
function validateReturn(command) {
	checkBytes(command)
	if (command[0] !== 0x90) {
		throw new RangeError('return message must start with 0x90')
	}
	if (command.indexOf(0xff, 1) !== command.length - 1) {
		throw new RangeError('only 0xFF in message must be its final byte')
	}
}

/**
 * Verify that the provided response is valid.  (Null corresponds to the
 * standard ACK and Completion response and so is inherently valid.)
 *
 * @param {?{ value: number[], mask: number[], params: Object.<string, { nibbles: number[], paramToChoice: (param: number) => string }> }[]} response
 */
function validateResponse(response) {
	if (response === null) return

	for (const { value, mask, params } of response) {
		if (value.length !== mask.length) {
			throw new RangeError('vals and masks must have equal length')
		}
		validateReturn(value)
		checkBytes(mask)

		/** @type {Set<number>} */
		const seen = new Set()
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
	#commandBytes
	#params
	#response
	#userDefined

	/**
	 * @param {number[]} commandBytes
	 *    An array of byte values that constitute this command, with any
	 *    parameter nibbles set to zero.  (For example, `81 01 04 61 0p FF` with
	 *    `p` as a parameter would use `[0x81, 0x01, 0x04, 0x61, 0x00, 0xFF]`).
	 * @param {?Object.<string, { nibbles: number[], choiceToParam: (choice: string) => number }>} params
	 *    A hash defining all parameters to be filled in the bytes of this
	 *    command.  (`null` is equivalent to an empty hash.)  Each key is the id
	 *    of the option that encodes the parameter, and each value is an object
	 *    specifying the zero-based offsets of the nibbles that constitute the
	 *    parameter in `commandBytes` (from most to least significant) and a
	 *    function converting option values to the number to store across those
	 *    nibbles.
	 * @param {?{ value: number[], mask: number[], params: Object.<string, { nibbles: number[], paramToChoice: (param: number) => string }> }[]} response
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
	 * @param {bool} userDefined
	 *    Whether this command was manually defined by the user, such that its
	 *    correctness can't be presumed -- in which case errors this command
	 *    triggers are logged but, unlike commands this module itself defines,
	 *    will not fail the connection
	 */
	constructor(commandBytes, params, response, userDefined) {
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
	 * @param {?CompanionOptionValues} options
	 *    An options object with properties compatible with the params used to
	 *    construct this.  `null` is permitted when this command has no
	 *    parameters.
	 * @returns {number[]}
	 *    Bytes representing this command, with parameters filled according to
	 *    the provided options.  The returned array must not be modified.
	 */
	toBytes(options) {
		const commandBytes = this.#commandBytes
		const params = this.#params
		if (params === null) {
			return commandBytes
		}

		let bytes = commandBytes.slice()
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
	 *
	 * @returns {?{ value: number[], mask: number[], params: Object.<string, { nibbles: number[], paramToChoice: (param: number) => string }> }[]} response
	 */
	response() {
		return this.#response
	}

	/**
	 * Whether this command was defined by the user, such that we can't expect
	 * it to execute without syntax errors, unexpected responses, and the like.
	 * Errors in user-defined commands are logged, but the connection isn't put
	 * into failure state because of user mistake -- whereas for errors with
	 * commands defined by this module, we fail the connection so that bugs will
	 * be discovered and reported as quickly as possible.
	 *
	 * @returns {bool}
	 */
	isUserDefined() {
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
	 * @param {number[]} commandBytes
	 *    An array of byte values that constitute this command, with any
	 *    parameter nibbles set to zero.  (For example, `81 01 04 61 0p FF` with
	 *    `p` as a parameter would use `[0x81, 0x01, 0x04, 0x61, 0x00, 0xFF]`).
	 * @param {?Object.<string, { nibbles: number[], choiceToParam: (choice: string) => number }>} params
	 *    A hash defining all parameters to be filled in the bytes of this
	 *    command.  (`null` is equivalent to an empty hash.)  Each key is the id
	 *    of the option that encodes the parameter, and each value is an object
	 *    specifying the zero-based offsets of the nibbles that constitute the
	 *    parameter in `commandBytes` (from most to least significant) and a
	 *    function converting option values to the number to store across those
	 *    nibbles.
	 * @param {?{ value: number[], mask: number[], params: Object.<string, { nibbles: number[], paramToChoice: (param: number) => string }> }[]} response
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
	constructor(commandBytes, params = null, response = null) {
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
	 * @param {number[]} commandBytes
	 *    An array of byte values that constitute this command, with any
	 *    parameter nibbles set to zero.  (For example, `81 01 04 61 0p FF` with
	 *    `p` as a parameter would use `[0x81, 0x01, 0x04, 0x61, 0x00, 0xFF]`).
	 * @param {?Object.<string, { nibbles: number[], choiceToParam: (choice: string) => number }>} params
	 *    A hash defining all parameters to be filled in the bytes of this
	 *    command.  (`null` is equivalent to an empty hash.)  Each key is the id
	 *    of the option that encodes the parameter, and each value is an object
	 *    specifying the zero-based offsets of the nibbles that constitute the
	 *    parameter in `commandBytes` (from most to least significant) and a
	 *    function converting option values to the number to store across those
	 *    nibbles.
	 * @param {?{ value: number[], mask: number[], params: Object.<string, { nibbles: number[], paramToChoice: (param: number) => string }> }[]} response
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
	constructor(commandBytes, params = null, response = null) {
		super(commandBytes, params, response, true)
	}
}

/**
 * Compare the bytes of `response` to the bytes of `values`.
 *
 * @param {number[]} response
 *    A VISCA response
 * @param {number[]} values
 *    Array of values
 * @returns bool
 *    true if `response` and `values` have equal length and contents
 */
export function responseIs(response, values) {
	if (response.length !== values.length) return false
	for (let i = 0; i < response.length; i++) {
		if (response[i] !== values[i]) return false
	}
	return true
}

/**
 * Compare the bytes of `response` to the bytes of `values`.
 *
 * @param {number[]} response
 *    A VISCA response
 * @param {number[]} mask
 *    Array of bit masks
 * @param {number[]} values
 *    Array of values
 * @returns bool
 *    true if `response` and `values` have the same length and for all `i`,
 *    `(response[i] & mask[i]) === values[i]`
 */
export function responseMatches(response, mask, values) {
	if (response.length !== values.length) return false
	for (let i = 0; i < response.length; i++) {
		if ((response[i] & mask[i]) !== values[i]) return false
	}
	return true
}

/**
 * Check the bytes of a VISCA command for envelope validity.
 *
 * @param {number[]} bytes
 *    The full byte sequence of the command
 * @returns {?string}
 *    null if the bytes are valid, an error message string if not
 */
export function checkCommandBytes(bytes) {
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
