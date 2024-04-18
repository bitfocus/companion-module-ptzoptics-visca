import { InstanceStatus, TCPHelper, type CompanionOptionValues } from '@companion-module/base'
import { checkCommandBytes, type Response, responseIs, responseMatches, Command } from './command.js'
import type { PtzOpticsInstance } from '../instance.js'
import { prettyBytes } from './utils.js'

const ResponseSyntaxError = [0x90, 0x60, 0x02, 0xff]
const ResponseCommandBufferFull = [0x90, 0x60, 0x03, 0xff]

const ResponseACKMask = [0xff, 0xf0, 0xff]
const ResponseACKValues = [0x90, 0x40, 0xff]

const ResponseCompletionMask = [0xff, 0xf0, 0xff]
const ResponseCompletionValues = [0x90, 0x50, 0xff]

const ResponseCommandNotExecutableMask = [0xff, 0xf0, 0xff, 0xff]
const ResponseCommandNotExecutableValues = [0x90, 0x60, 0x41, 0xff]

/**
 * A response that consists of ACK followed by Completion.
 *
 * This is appears to be the format of the response to every command in the
 * 20231027 PTZOptics VISCA over IP Commands document.  (It's definitely the
 * format of the response to every command this module sends.)  Inquiries use a
 * different response format, but this module doesn't support any yet.
 */
const StandardResponse: Response[] = [
	{ value: ResponseACKValues, mask: ResponseACKMask, params: {} },
	{ value: ResponseCompletionValues, mask: ResponseCompletionMask, params: {} },
]

const BLAME_MODULE =
	'This is likely a bug in the ptzoptics-visca Companion module.  Please ' +
	"click the bug icon by any camera instance in the table in Companion's " +
	'Connections tab to report it.'

/**
 * The subset of the `PtzOpticsInstance` interface used by `VISCAPort` to log
 * messages and update instance connection status.
 */
interface PartialInstance {
	/** See {@link PtzOpticsInstance.log}. */
	log: PtzOpticsInstance['log']

	/** See {@link PtzOpticsInstance.updateStatus}. */
	updateStatus: PtzOpticsInstance['updateStatus']
}

/**
 * A port abstraction into which VISCA commands can be written.
 */
export class VISCAPort {
	/**
	 * The TCP socket through which commands are sent and responses received,
	 * if this port is open.
	 */
	#socket: TCPHelper | null = null

	/** The instance that created this port. */
	#instance: PartialInstance

	/**
	 * A count of how many commands' responses are still waiting to be read.
	 * (This will include a response currently being processed.)
	 */
	#pending = 0

	/**
	 * Bytes of data received that have not yet been parsed as full responses.
	 */
	#receivedData: number[] = []

	/**
	 * A promise that resolves when the response to the previous command (which
	 * may be an error response) has been processed, overwritten every time a
	 * new command is sent.
	 *
	 * If the command's expected response contains no parameters, or the
	 * response was an error, the promise resolves null.  Otherwise it resolves
	 * an object whose properties are choices corresponding to the parameters in
	 * the response.
	 */
	#lastResponsePromise: Promise<CompanionOptionValues | null> = Promise.resolve(null)

	/**
	 * A promise to wait upon for `this.#receivedData` to be extended with more
	 * data.
	 *
	 * This property is overwritten with a new promise every time new data is
	 * received.  The promise is resolved with no value, so awaiting an earlier
	 * promise here will expose a `this.#receivedData` containing received data
	 * corresponding to later-in-time promises written here.
	 */
	#moreDataAvailable: Promise<void> = Promise.resolve()

	/**
	 * Create a VISCAPort associated with the provided instance.  The port is
	 * initially closed and must be opened to be used.
	 */
	constructor(instance: PartialInstance) {
		this.#instance = instance
		this.#reset()
	}

	/** Reset this port to its initial, non-open state. */
	#reset() {
		if (this.#socket !== null) {
			this.#socket.destroy()
			this.#socket = null

			this.#pending = 0
			this.#receivedData.length = 0
			this.#lastResponsePromise = Promise.resolve(null)
			this.#moreDataAvailable = Promise.resolve()
		}
	}

	/** Open this port connecting to the given host:port. */
	async open(host: string, port: number): Promise<void> {
		const socket = (this.#socket = new TCPHelper(host, port))

		const instance = this.#instance

		instance.updateStatus(InstanceStatus.Connecting)

		const connected = new Promise<void>((resolve: () => void) => {
			socket.on('connect', () => {
				instance.log('debug', 'Connected')
				instance.updateStatus(InstanceStatus.Ok)
				resolve()
			})
		})
		socket.on('status_change', (_status, message) => {
			instance.log('debug', `Status change: ${message}`)
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

		return connected
	}

	/** True iff this port is currently closed. */
	get closed(): boolean {
		return this.#socket === null
	}

	/** Close this port if it's currently open. */
	close(): void {
		this.#reset()
		this.#instance.updateStatus(InstanceStatus.Disconnected)
	}

	/**
	 * Create an error to throw during command/response processing whose
	 * message contains `msg` and a representation of `bytes` if provided.
	 *
	 * @param msg
	 *    An error message describing the error
	 * @param bytes
	 *    Optional bytes to include in the error.  (These may be from a command
	 *    or a response, depending how `msg` is written.)
	 * @returns
	 *    An error containing the message and pretty-printed `bytes`
	 */
	#errorWhileHandlingCommand(msg: string, bytes: readonly number[]): Error {
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
	 * @param command
	 *    The command to send.
	 * @param options
	 *    Compatible options to use to fill in any parameters in `command`; may
	 *    be omitted or null if `command` has no parameters.
	 * @returns {Promise<?CompanionOptionValues>}
	 *    A promise that resolves after the response to `command` (which may be
	 *    an error response) has been processed.  The promise presently always
	 *    resolves null, except that a response containing a parameter causes it
	 *    to reject.
	 */
	async sendCommand(
		command: Command,
		options: CompanionOptionValues | null = null
	): Promise<CompanionOptionValues | null> {
		const commandBytes = command.toBytes(options)
		const err = checkCommandBytes(commandBytes)
		if (err) {
			this.#instance.log('error', `Error in command ${prettyBytes(commandBytes)}: ${err}`)
			if (!command.isUserDefined()) {
				this.#instance.log('error', BLAME_MODULE)
			}
			return null
		}

		const socket = this.#socket
		if (socket === null) {
			this.#instance.log('error', `Socket not open to send ${prettyBytes(commandBytes)}`)
			return null
		}

		const commandBuffer = Buffer.from(commandBytes)

		// XXX A failed write needs to be handled here!
		void socket.send(commandBuffer)

		this.#pending++

		const p = this.#lastResponsePromise
			.then(async () => {
				try {
					return await this.#processResponse(socket, command, commandBuffer)
				} finally {
					this.#pending--
				}
			})
			.catch((err) => {
				this.close()
				this.#instance.log('error', `Error processing response: ${err.message}`)
				this.#instance.updateStatus(InstanceStatus.ConnectionFailure)
				throw err
			})
		this.#lastResponsePromise = p
		return p
	}

	/**
	 * Process the full response (which may comprise multiple return messages)
	 * to the given command.
	 *
	 * @param socket
	 *    The socket used by this port.
	 * @param command
	 *    The command whose response is being processed.
	 * @param commandBytes
	 *    The bytes of `command` that were sent.
	 * @returns
	 *    A promise that resolves after the response to `command` (which may be
	 *    an error response) has been processed.  If `command`'s expected
	 *    response contains no parameters, or the response was an error, the
	 *    promise resolves null.  Otherwise it resolves an object whose
	 *    properties are choices corresponding to the parameters in the
	 *    response.
	 */
	async #processResponse(
		socket: TCPHelper,
		command: Command,
		commandBuffer: Buffer
	): Promise<CompanionOptionValues | null> {
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
				return null
			}

			// But if this is the only pending command, we can just resend it
			// and try reading a response again.  With luck, enough time has
			// passed that the command buffer is no longer full (from some other
			// manipulation process that's inherently racing this connection).
			this.#instance.log('info', `Command buffer full: resending ${prettyBytes(commandBuffer)}`)

			// XXX A failed write needs to be handled here!
			void socket.send(commandBuffer)
		}

		// Check for various errors specifically before processing the response
		// according to the prescribed instructions.  (This assumes that no
		// command *intentionally* returns such an error as the first message in
		// its expected response.)

		// Command Not Executable
		if (responseMatches(response, ResponseCommandNotExecutableMask, ResponseCommandNotExecutableValues)) {
			const msg =
				`The command ${prettyBytes(commandBuffer)} can't be executed now.  ` +
				'This is likely because the command alters a setting that ' +
				"doesn't pertain to a current camera mode; activate the " +
				'relevant camera mode before executing this command.'
			this.#instance.log('error', msg)
			return null
		}

		// Syntax Error
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
			return null
		}

		let i = 0
		let out = null
		const expectedResponse = command.response() || StandardResponse
		for (; i < expectedResponse.length; i++) {
			if (i > 0) {
				response = await this.#readOneReturnMessage()
			}

			const { value, mask, params } = expectedResponse[i]
			if (!responseMatches(response, mask, value)) {
				const blame = command.isUserDefined() ? 'Double-check the syntax of your command.' : BLAME_MODULE
				const msg =
					`The command ${prettyBytes(commandBuffer)} received an ` +
					`unrecognized response ${prettyBytes(response)} that ` +
					'will be treated as the end of the overall response.  ' +
					`(${blame})  If this assumption is inaccurate, this ` +
					'camera instance will likely be unstable.  Proceed with ' +
					'caution!'
				this.#instance.log('info', msg)
				return null
			}

			for (const [id, { nibbles, paramToChoice }] of Object.entries(params)) {
				if (out === null) {
					out = Object.create(null)
				}

				let param = 0
				for (const nibble of nibbles) {
					const byteOffset = nibble >> 1
					const isLower = nibble % 2 == 1

					const byte = response[byteOffset]
					const contrib = isLower ? byte & 0xf : byte >> 4
					param = (param << 4) | contrib
				}

				out[id] = paramToChoice(param)
			}
		}

		return out
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
				leadingBytes
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
