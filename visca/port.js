import { InstanceStatus, TCPHelper } from '@companion-module/base'
import { checkCommandBytes, responseIs, responseMatches } from './command.js'
import { prettyBytes } from './utils.js'

const ResponseSyntaxError = [0x90, 0x60, 0x02, 0xff]
const ResponseCommandBufferFull = [0x90, 0x60, 0x03, 0xff]

const ResponseACKMask = [0xff, 0xf0, 0xff]
const ResponseACKValues = [0x90, 0x40, 0xff]

const ResponseCompletionMask = [0xff, 0xf0, 0xff]
const ResponseCompletionValues = [0x90, 0x50, 0xff]

const ResponseCommandNotExecutableMask = [0xff, 0xf0, 0xff, 0xff]
const ResponseCommandNotExecutableValues = [0x90, 0x60, 0x41, 0xff]

const BLAME_MODULE =
	'This is likely a bug in the ptzoptics-visca Companion module.  Please ' +
	"click the bug icon by any camera instance in the table in Companion's " +
	'Connections tab to report it.'

/**
 * A port abstraction into which VISCA commands can be written.
 */
export class VISCAPort {
	/**
	 * The TCP socket through which commands are sent and responses received.
	 * @type {?TCPHelper}
	 */
	#socket = null

	/**
	 * The instance that created this port.
	 * @type {PtzOpticsInstance}
	 */
	#instance

	/**
	 * A count of how many commands' responses are still waiting to be read.
	 * (This will include a response currently being processed.)
	 */
	#pending = 0

	/**
	 * Bytes of data received that have not yet been parsed as full responses.
	 * @type {number[]}
	 */
	#receivedData = []

	/**
	 * A promise that resolves once all previous command responses have been
	 * processed, overwritten every time a new command is sent.
	 * @type {Promise<void>}
	 */
	#lastResponsePromise = Promise.resolve()

	/**
	 * A promise to wait upon for `this.#receivedData` to be extended with more
	 * data.
	 *
	 * This property is overwritten with a new promise every time new data is
	 * received.  The promise is resolved with no value, so awaiting an earlier
	 * promise here will expose a `this.#receivedData` containing received data
	 * corresponding to later-in-time promises written here.
	 * @type {?Promise<void>}
	 */
	#moreDataAvailable = null

	/**
	 * Create a VISCAPort associated with the provided instance.  The port is
	 * initially closed and must be opened to be used.
	 *
	 * @param {PtzOpticsInstance} instance
	 */
	constructor(instance) {
		this.#instance = instance
		this.#reset()
	}

	/** Reset this port to its initial, non-open state. */
	#reset() {
		if (this.#socket !== null) {
			this.#socket.destroy()
			this.#socket = null
		}

		this.#pending = 0
		this.#receivedData.length = 0
		this.#lastResponsePromise = Promise.resolve()
		this.#moreDataAvailable = null
	}

	/**
	 * Open this port connecting to the given host:port.
	 *
	 * @param {string} host
	 * @param {number} port
	 */
	open(host, port) {
		const socket = (this.#socket = new TCPHelper(host, port))

		const instance = this.#instance

		instance.updateStatus(InstanceStatus.Connecting)

		socket.on('connect', () => {
			instance.log('debug', 'Connected')
			instance.updateStatus(InstanceStatus.Ok)
		})
		socket.on('status_change', (_status, message) => {
			instance.log('debug', message)
		})
		socket.on('error', (err) => {
			// Make sure that we log and update Companion connection status for
			// a network failure.
			instance.log('error', `Network error: ${err.message}`)
			instance.updateStatus(InstanceStatus.ConnectionFailure)
		})

		const waitForNewData = () => {
			this.#moreDataAvailable = new Promise((resolve) => {
				socket.once('data', (data) => {
					if (this.closed) {
						// Ignore incoming data if the connection's already closed
						// (including if by module error).
					} else {
						for (const b of data) this.#receivedData.push(b)
						resolve()
						waitForNewData()
					}
				})
			})
		}

		waitForNewData()
	}

	/** True iff this port is currently closed. */
	get closed() {
		return this.#socket === null
	}

	/** Close this port if it's currently open. */
	close() {
		this.#reset()
		this.#instance.updateStatus(InstanceStatus.Disconnected)
	}

	/**
	 * Create an error to throw during command/response processing whose
	 * message contains `msg` and a representation of `bytes` if provided.
	 *
	 * @param {string} msg
	 *    An error message describing the error
	 * @param {Buffer|Array<number>|null} bytes
	 *    Optional bytes to include in the error.  (These may be from a command
	 *    or a response, depending how `msg` is written.)
	 * @throws {Error}
	 *    An error containing the message and pretty-printed `bytes`
	 */
	#errorWhileHandlingCommand(msg, bytes = null) {
		const message = `${msg}${bytes ? ` (VISCA bytes ${prettyBytes(bytes)})` : ''}`
		return new Error(message)
	}

	/**
	 * Kick off sending the given command, then kick off asynchronous processing
	 * of its response.
	 *
	 * Don't wait for the preceding command's response to be sent before sending
	 * the command: some commands (for example, recalling presets) only receive
	 * a full response after a delay, and it isn't acceptable to block a command
	 * (for example, recalling a different preset because someone fat-fingered
	 * the wrong button) during that time.
	 *
	 * @param {Command} command
	 *    The command to send.
	 * @param {?CompanionOptionValues} options
	 *    The options to use to fill in any parameters in `command`; may be
	 *    omitted if `command` has no parameters.
	 * @returns {Promise<void>}
	 *    A promise that resolves after the response to `command` (which may be
	 *    an error response) has been processed
	 */
	sendCommand(command, options = null) {
		const commandBytes = command.toBytes(options)
		const err = checkCommandBytes(commandBytes)
		if (err) {
			this.#instance.log('error', `Error in command ${prettyBytes(commandBytes)}: ${err}`)
			if (!command.isUserDefined()) {
				this.#instance.log('error', BLAME_MODULE)
			}
			return
		}

		if (this.closed) {
			this.#instance.log('error', `Socket not open to send ${prettyBytes(commandBytes)}`)
			return
		}

		const commandBuffer = Buffer.from(commandBytes)
		this.#socket.send(commandBuffer)

		this.#pending++

		const p = this.#lastResponsePromise
			.then(async () => {
				try {
					await this.#processResponse(command, commandBuffer)
				} finally {
					this.#pending--
				}
			})
			.catch((err) => {
				this.close()
				this.#instance.log('error', `Error processing response: ${err.message}`)
				this.#instance.updateStatus(InstanceStatus.ConnectionFailure)
			})
		this.#lastResponsePromise = p
		return p
	}

	/**
	 * Process the full response (which may comprise multiple return messages)
	 * to the given command.
	 *
	 * @param {Command} command
	 *    The command whose response is being processed.
	 * @param {Buffer} commandBytes
	 *    The bytes of `command` that were sent.
	 * @returns {Promise<void>}
	 *    A promise that resolves/rejects when the full response has been
	 *    processed.
	 */
	async #processResponse(command, commandBuffer) {
		let response
		for (;;) {
			response = await this.#readOneReturnMessage()
			if (!responseIs(response, ResponseCommandBufferFull)) {
				break
			}

			// If commands have been sent after this one, we can't safely resend
			// because that would effectively reorder this command after those
			// commands and have uncertain effects.  Log an error and hope for
			// the best.
			if (this.#pending > 1) {
				const msg = `Command buffer full: ${prettyBytes(commandBuffer)} was not executed`
				this.#instance.log('error', msg)
				return
			}

			// But if this is the only pending command, we can just resend it
			// and try reading a response again.  With luck, enough time has
			// passed that the command buffer is no longer full (from some other
			// manipulation process that's inherently racing this connection).
			this.#instance.log('info', `Command buffer full: resending ${prettyBytes(commandBuffer)}`)
			this.#socket.send(commandBuffer)
		}

		// Skip over a single ACK.
		if (responseMatches(response, ResponseACKMask, ResponseACKValues)) {
			response = await this.#readOneReturnMessage()
		}

		// A Completion response completes the reply process.
		if (responseMatches(response, ResponseCompletionMask, ResponseCompletionValues)) {
			return
		}

		// Otherwise (until we implement inquiries, whose return packages have a
		// variety of formats and contain output parameters) we hit an error:
		// the camera replied with unexpected bytes, a command was sent outside
		// of its operating mode -- or there's a bug in our handling of the
		// command and its response.

		// Explicitly check for various specific errors to most clearly report
		// their occurrence to the attentive Companion operator.
		if (responseIs(response, ResponseSyntaxError)) {
			const userDefined = command.isUserDefined()
			const blame = userDefined ? 'Double-check the syntax of the command.' : BLAME_MODULE
			const msg = 'Camera reported a syntax error in the command ' + `${prettyBytes(commandBuffer)}.  ${blame}`

			// Different models of camera support different features, so we
			// can't treat a syntax error in a command defined by this module as
			// an error:
			//
			// 1) The Preset Drive Speed action triggers a syntax error with G3
			//    cameras -- the actual command doesn't contain a preset number
			//    parameter, so the speed change applies to all presets.  But we
			//    don't know if older cameras support it.
			// 2) The Exposure Mode action exposes a "Bright mode (manual)"
			//    option that was present in G2 cameras[0] but doesn't exist in
			//    G3 cameras[1] and triggers a syntax error with them.
			//
			// 0. https://ptzoptics.imagerelay.com/share/PTZOptics-G2-VISCA-over-IP-Commands
			// 1. https://ptzoptics.imagerelay.com/share/PTZOptics-G3-VISCA-over-IP-Commands
			this.#instance.log('error', msg)
			return
		}

		if (responseMatches(response, ResponseCommandNotExecutableMask, ResponseCommandNotExecutableValues)) {
			const msg =
				`The command ${prettyBytes(commandBuffer)} can't be executed ` +
				'now.  This is likely because the command alters a setting ' +
				"that doesn't pertain to the current camera mode; activate " +
				'the relevant camera mode before executing this command.'
			this.#instance.log('info', msg)
			return
		}

		const msg =
			`The command ${prettyBytes(commandBuffer)} received the ` +
			`unrecognized response ${prettyBytes(response)}.  The instance ` +
			"will probably keep working, but you'll have to verify the " +
			'camera is in a desirable state yourself.  Proceed with caution!'
		this.#instance.log('info', msg)
	}

	/**
	 * Read a single [0x90, ..., 0xFF] response.
	 *
	 * @returns {number[]}
	 *    The full bytes of the response, from leading 0x90 to terminating 0xFF.
	 */
	async #readOneReturnMessage() {
		const receivedData = this.#receivedData
		while (receivedData.length === 0) {
			await this.#moreDataAvailable
		}

		// PTZOptics VISCA over IP responses always begin with 0x90.
		if (receivedData[0] !== 0x90) {
			const leadingBytes = receivedData.slice(0, 8)
			throw this.#errorWhileHandlingCommand(
				'Error at start of camera response: response not starting with 0x90',
				leadingBytes,
			)
		}

		let i = 1
		let terminatorOffset = -1
		for (;;) {
			// All VISCA responses terminate with 0xFF.
			terminatorOffset = receivedData.indexOf(0xff, i)
			if (terminatorOffset > 0) {
				break
			}

			i = receivedData.length
			await this.#moreDataAvailable
		}

		return receivedData.splice(0, terminatorOffset + 1)
	}
}
