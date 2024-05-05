import { type CompanionOptionValues, InstanceBase, type SomeCompanionConfigField } from '@companion-module/base'
import { getActions } from './actions.js'
import { getConfigFields, type PtzOpticsConfig } from './config.js'
import { getPresets } from './presets.js'
import type { Command, Inquiry } from './visca/command.js'
import { VISCAPort } from './visca/port.js'

export class PtzOpticsInstance extends InstanceBase<PtzOpticsConfig> {
	#config: PtzOpticsConfig = {
		host: '',
		port: '5678',
	}
	#visca

	/**
	 * Send the given command to the camera, filling in any parameters from the
	 * specified options.  The options must be compatible with the command's
	 * parameters.
	 *
	 * @param command
	 *    The command to send.
	 * @param options
	 *    Compatible options to use to fill in any parameters in `command`; may
	 *    be omitted if `command` has no parameters.
	 * @returns
	 *    A promise that resolves after the response to `command` (which may be
	 *    an error response) has been processed.  If `command`'s response was an
	 *    an error not implicating overall connection stability, the promise
	 *    resolves `undefined``.  Otherwise it resolves an object whose properties are
	 *    choices corresponding to the parameters in the response.
	 */
	async sendCommand(command: Command, options: CompanionOptionValues = {}): Promise<void> {
		return this.#visca.sendCommand(command, options).then(
			(result: void | Error) => {
				if (typeof result === 'undefined') {
					return
				}

				this.log('error', `Error processing command: ${result.message}`)
			},
			(reason: Error) => {
				// Swallow the error so that execution gracefully unwinds.
				this.log('error', `Unhandled command rejection was suppressed: ${reason}`)
				return
			}
		)
	}

	/**
	 * Send the given inquiry to the camera.
	 *
	 * @param inquiry
	 *    The inquiry to send.
	 * @returns
	 *    A promise that resolves after the response to `inquiry` (which may be
	 *    an error response) has been processed.  If `inquiry`'s response was an
	 *    an error not implicating overall connection stability, the promise
	 *    resolves null.  Otherwise it resolves an object whose properties are
	 *    choices corresponding to the parameters in the response.
	 */
	async sendInquiry(inquiry: Inquiry): Promise<CompanionOptionValues | null> {
		return this.#visca.sendInquiry(inquiry).then(
			(result: CompanionOptionValues | Error) => {
				if (result instanceof Error) {
					this.log('error', `Error processing inquiry: ${result.message}`)
					return null
				}

				return result
			},
			(reason: Error) => {
				// Swallow the error so that execution gracefully unwinds.
				this.log('error', `Unhandled inquiry rejection was suppressed: ${reason}`)
				return null
			}
		)
	}

	/**
	 * The speed to be passed in the pan/tilt speed parameters of Pan Tilt Drive
	 * VISCA commands.  Ranges between 0x01 (low speed) and 0x18 (high speed).
	 * However, as 0x15-0x18 are valid only for panning, tilt speed is capped at
	 * 0x14.
	 */
	#speed = 0x0c

	panTiltSpeed(): { panSpeed: number; tiltSpeed: number } {
		return {
			panSpeed: this.#speed,
			tiltSpeed: Math.min(this.#speed, 0x14),
		}
	}

	setPanTiltSpeed(speed: number): void {
		if (0x01 <= speed && speed <= 0x18) {
			this.#speed = speed
		} else {
			this.log('debug', `speed ${speed} unexpectedly not in range [0x01, 0x18]`)
			this.#speed = 0x0c
		}
	}

	increasePanTiltSpeed(): void {
		if (this.#speed < 0x18) this.#speed++
	}

	decreasePanTiltSpeed(): void {
		if (this.#speed > 0x01) this.#speed--
	}

	constructor(internal: unknown) {
		super(internal)

		this.#visca = new VISCAPort(this)
	}

	// Return config fields for web config of the module instance
	getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields()
	}

	// When the module gets deleted
	async destroy(): Promise<void> {
		this.log('info', `destroying module: ${this.id}`)
		this.#visca.close()
	}

	async init(config: PtzOpticsConfig): Promise<void> {
		this.#config = config

		this.setActionDefinitions(getActions(this))
		this.setPresetDefinitions(getPresets())

		// Start up the TCP socket and attempt to connect to the camera.
		return this.#initTCP()
	}

	async #initTCP(): Promise<void> {
		this.#visca.close()

		if (this.#config.host !== '') {
			return this.#visca.open(this.#config.host, Number(this.#config.port))
		}
	}

	async configUpdated(config: PtzOpticsConfig): Promise<void> {
		// Reset the connection if the connection is closed or the camera's
		// address has changed.
		const resetConnection = this.#visca.closed || this.#config.host !== config.host || this.#config.port !== config.port

		this.#config = config

		if (resetConnection) {
			return this.#initTCP()
		}
	}
}
