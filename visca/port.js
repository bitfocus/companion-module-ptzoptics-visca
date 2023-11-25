import { TCPHelper } from '@companion-module/base'
import { checkCommandBytes } from './command.js'
import { prettyBytes } from './utils.js'

/**
 * A port abstraction into which VISCA commands can be written.
 */
export class VISCAPort {
	/** The TCP socket through which commands are sent. */
	#socket = null

	/** The instance that created this port. */
	#instance

	/** Create a VISCAPort for the provided instance. */
	constructor(instance) {
		this.#instance = instance
	}

	/** Open this port connecting to the given host:port. */
	open(host, port) {
		const socket = (this.#socket = new TCPHelper(host, port))
		const instance = this.#instance

		instance.updateStatus('connecting')

		socket.on('status_change', (_status, message) => {
			instance.log('debug', message)
		})

		socket.on('error', (err) => {
			// Make sure that we log and update Companion connection status for
			// a network failure.
			instance.log('error', 'Network error: ' + err.message)
			instance.updateStatus('connection_failure')
		})

		socket.on('connect', () => {
			instance.log('debug', 'Connected')
			instance.updateStatus('ok')
		})
	}

	/** Close this port, or do nothing if it's already closed. */
	close() {
		if (!this.closed) {
			this.#socket.destroy()
			this.#socket = null
			this.#instance.updateStatus('disconnected')
		}
	}

	/** True iff this port is currently closed. */
	get closed() {
		return this.#socket === null
	}

	/**
	 * Send a VISCA command.  (Bytes are sent asynchronously, so they may not
	 * have hit the wire when this function returns.)
	 *
	 * @param {Command} command
	 *    The command to send.
	 * @param {?CompanionOptionValues} options
	 *    The options to use to fill in any parameters in `command`; may be
	 *    omitted if `command` has no parameters.
	 */
	sendCommand(command, options = null) {
		const commandBytes = command.toBytes(options)
		const err = checkCommandBytes(commandBytes)
		if (err) {
			this.#instance.log('error', err)
			return
		}

		if (this.closed) {
			this.#instance.log('error', `socket not open to send bytes ${prettyBytes(commandBytes)}`)
			return
		}

		const commandBuffer = Buffer.from(commandBytes)
		this.#socket.send(commandBuffer)
	}
}
