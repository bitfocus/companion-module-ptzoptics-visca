import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { getActions } from './actions/actions.js'
import {
	canUpdateConfigWithoutRestarting,
	type RawConfig,
	getConfigFields,
	isValidHost,
	noCameraConfig,
	type PtzOpticsConfig,
	validateConfig,
} from './config.js'
import { getPresets } from './presets.js'
import { repr } from './utils/repr.js'
import type { Command, CommandParameters, CommandParamValues, NoCommandParameters } from './visca/command.js'
import type { Answer, AnswerParameters, Inquiry } from './visca/inquiry.js'
import { VISCAPort } from './visca/port.js'

export class PtzOpticsInstance extends InstanceBase<RawConfig> {
	/** Configuration dictating the behavior of this instance. */
	#config: PtzOpticsConfig = noCameraConfig()

	/** Whether debug logging is enabled on this instance or not. */
	get debugLogging(): boolean {
		return this.#config.debugLogging
	}

	/** A port to use to communicate with the represented camera. */
	#visca = new VISCAPort(this)

	/**
	 * Send the given command to the camera, filling in any parameters from the
	 * specified options.  The options must be compatible with the command's
	 * parameters.
	 *
	 * @param command
	 *    The command to send.
	 * @param paramValues
	 *    A parameter values object compatible with this command's parameters
	 *    and their types.  (This can be omitted if the command lacks
	 *    parameters.)
	 */
	sendCommand<CmdParameters extends CommandParameters>(
		command: Command<CmdParameters>,
		...paramValues: CmdParameters extends NoCommandParameters
			? [CommandParamValues<CmdParameters>?]
			: [CommandParamValues<CmdParameters>]
	): void {
		// `sendCommand` implicitly waits for the connection to be fully
		// established, so it's unnecessary to resolve `this.#visca.connect()`
		// here.
		this.#visca.sendCommand(command, ...paramValues).then(
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
			},
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
	async sendInquiry<Parameters extends AnswerParameters>(
		inquiry: Inquiry<Parameters>,
	): Promise<Answer<Parameters> | null> {
		// `sendInquiry` implicitly waits for the connection to be fully
		// established, so it's unnecessary to resolve `this.#visca.connect()`
		// here.
		return this.#visca.sendInquiry(inquiry).then(
			(result: Answer<Parameters> | Error) => {
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
			},
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

	override getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields()
	}

	override async destroy(): Promise<void> {
		this.log('info', `destroying module: ${this.id}`)
		this.#visca.close('Instance is being destroyed', InstanceStatus.Disconnected)
	}

	override async init(config: RawConfig): Promise<void> {
		this.#logConfig(config, 'init()')

		this.setActionDefinitions(getActions(this))
		this.setPresetDefinitions(getPresets())

		return this.configUpdated(config)
	}

	override async configUpdated(config: RawConfig): Promise<void> {
		this.#logConfig(config, 'configUpdated()')

		const oldConfig = this.#config

		validateConfig(config)
		this.#config = config

		if (canUpdateConfigWithoutRestarting(oldConfig, config)) {
			return
		}

		if (!isValidHost(this.#config.host)) {
			this.#visca.close('no host specified', InstanceStatus.Disconnected)
		} else {
			// Initiate the connection (closing any prior connection), but don't
			// delay to fully establish it as `await this.#visca.connect()`
			// would, because network vagaries might make this take a long time.
			this.#visca.open(this.#config.host, this.#config.port)
		}
	}

	/**
	 * Write a copy of the given module config information to logs.
	 *
	 * @param config
	 *   The config information to log.
	 * @param desc
	 *   A description of the event occasioning the logging.
	 */
	#logConfig(config: RawConfig, desc = 'logConfig()'): void {
		this.log('info', `PTZOptics module configuration on ${desc}: ${repr(config)}`)
	}
}
