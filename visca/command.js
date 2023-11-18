import { checkBytes, prettyBytes } from './utils.js'

// TERMINOLOGY NOTE:
// Eight bits is a byte.  The upper or lower four-bit half of a byte is a
// nibble.  VISCA commands encode parameter values in one or more nibbles.

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
 * A command, potentially including user-provided parameters, that's expected to
 * complete successfully with a response containing no parameters.
 */
export class Command {
	#commandBytes
	#params
	#userDefined = false

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
	 */
	constructor(commandBytes, params) {
		checkBytes(commandBytes)
		this.#commandBytes = commandBytes

		validateCommandParams(params, commandBytes)
		this.#params = params
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
 * parameters, that's expected to complete successfully with a response
 * containing no parameters.
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
	 */
	constructor(commandBytes, params = null) {
		super(commandBytes, params)
	}
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

/**
 * Send the given VISCA command.  (Bytes are sent asynchronously, so they may
 * not have hit the wire when this function returns.)
 *
 * @param {PtzOpticsInstance} instance
 *    The instance to send through.
 * @param {Command} command
 *    The command to send.
 * @param {?CompanionOptionValues} options
 *    The options to use to fill in any parameters in the command; may be
 *    omitted if the command has no parameters.
 */
export function sendVISCACommand(instance, command, options = null) {
	const commandBytes = command.toBytes(options)
	instance.sendVISCACommandBytes(commandBytes)
}
