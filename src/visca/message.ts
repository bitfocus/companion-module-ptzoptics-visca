import { type Bytes } from '../utils/byte.js'

/** The byte value that terminates a VISCA message. */
export const MessageDelimiter = 0xff

/**
 * Base class for all VISCA messages sent to a camera, both commands and
 * inquiries, no matter the parameters present in them, and no matter the
 * response expected to an inquiry.
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
 * Check the bytes of a VISCA message (command or inquiry, *not* response) for
 * envelope validity.
 *
 * @returns null if the bytes are valid, an error message string if not
 */
export function checkMessageBytes(bytes: Bytes): string | null {
	if (bytes.length === 0) {
		return 'message must not be empty'
	}

	// VISCA was first developed by Sony, then ad-hoc implemented by other
	// camera vendors.  There doesn't appear to be a standardized message
	// these assertions presently hold against PTZ Optics's documented VISCA
	// commands, and if command start/end weren't delimited as required here,
	// it's hard to say what series of sent bytes a camera response indicating a
	// syntax error (90 60 02 FF) would apply to.
	if (bytes[0] !== 0x81) {
		// VISCA generally says the first byte is 8x, where x encodes the
		// particular camera to which the command applies when cameras are
		// connected in series.  But PTZOptics VISCA over TCP forces x=1.
		return 'first byte in message must be 0x81'
	}

	const idx = bytes.indexOf(0xff, 1)
	if (idx < 0) {
		return 'message must end in 0xFF'
	}
	if (idx !== bytes.length - 1) {
		return 'message must not contain embedded 0xFF'
	}

	return null
}
