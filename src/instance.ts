import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import fetch, { type Response } from 'node-fetch'
import DigestClient from 'digest-fetch'
import { getActions } from './actions/actions.js'
import { getConfigFields, type PtzOpticsConfig } from './config.js'
import {
	canUpdateOptionsWithoutRestarting,
	noCameraOptions,
	optionsFromConfig,
	type PtzOpticsOptions,
} from './options.js'
import { getPresets } from './presets.js'
import { repr } from './utils/repr.js'
import type { Command, CommandParameters, CommandParamValues, NoCommandParameters } from './visca/command.js'
import type { Answer, AnswerParameters, Inquiry } from './visca/inquiry.js'
import { VISCAPort } from './visca/port.js'

export class PtzOpticsInstance extends InstanceBase<PtzOpticsConfig> {
	/** Options dictating the behavior of this instance. */
	#options: PtzOpticsOptions = noCameraOptions()
	/** Interval timer used to check tally status. */
	private tallyPollTimer: NodeJS.Timeout | null = null
	/** Whether debug logging is enabled on this instance or not. */
	get debugLogging(): boolean {
		return this.#options.debugLogging
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
	 * Detect the digest authentication algorithm used by the camera.
	 * @param host The hostname or IP address of the camera.
	 * @returns The name of the digest authentication algorithm.
	 */
	async detectDigestAlgorithm(host: string | null): Promise<string> {
		if (typeof host !== 'string' || host.length === 0) {
			throw new Error('No valid host configured')
		}
		// /cgi-bin/param.cgi?get_device_conf is the same for G2 and G3 cameras
		const url = `http://${host}/cgi-bin/param.cgi?get_device_conf`
		if (this.debugLogging) this.log('debug', `Fetching ${url} to detect digest algorithm`)

		const fetchPromise = fetch(url, { method: 'GET' })
		const timeoutPromise = new Promise<never>(
			(_, reject) => setTimeout(() => reject(new Error('Request timed out')), 1000), // 1s timeout
		)
		let res: Response | null = null
		try {
			// res = await fetch(url, { method: 'GET' })
			res = await Promise.race([fetchPromise, timeoutPromise])
		} catch (error) {
			this.log('error', `Error fetching digest algorithm: ${error}`)
			throw new Error('Failed to fetch digest algorithm')
		}
		const wwwAuth = res.headers.get('www-authenticate')
		if (wwwAuth === null || wwwAuth.trim() === '') {
			throw new Error('No WWW-Authenticate header from server')
		}

		const match = /algorithm="?([A-Za-z0-9-]+)"?/.exec(wwwAuth)
		if (this.debugLogging) this.log('debug', `Detected digest algorithm: ${match}`)
		return match ? match[1] : 'MD5' // default fallback
	}

	/**
	 * Send HTTP/CGI command to the camera.
	 */
	#digestClient: DigestClient | null = null

	async sendHTTPCommand<T = any>(path: string, method: 'GET' | 'POST'): Promise<T> {
		if (this.debugLogging) this.log('debug', `sendHTTPCommand: ${method} ${path}`)
		if (!this.#digestClient) {
			// get required algorithm
			const algorithm = await this.detectDigestAlgorithm(this.#options.host)
			if (this.debugLogging) this.log('debug', `Creating new DigestClient for HTTP commands`)
			const username = this.#options.httpUsername
			const password = this.#options.httpPassword
			this.#digestClient = new DigestClient(username, password, {
				algorithm,
				headers: {
					'User-Agent': 'Mozilla/5.0',
					Accept: '*/*',
					'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
				},
				logger: this.debugLogging ? console : undefined,
			})
		}
		const url = `http://${this.#options.host}${path}`

		const fetchPromise = this.#digestClient.fetch(url, {
			method,
			body: method === 'POST' ? 'cururl=http://' : undefined,
			data: '',
		})
		const timeoutPromise = new Promise<never>(
			(_, reject) => setTimeout(() => reject(new Error('Request timed out')), 5000), // 5 seconds timeout
		)

		const response = await Promise.race([fetchPromise, timeoutPromise])
		const text = await response.text()
		if (this.debugLogging) console.log(`Response:`)
		if (this.debugLogging) console.log(`Header: ${JSON.stringify([...response.headers])}`)
		if (this.debugLogging) console.log(`Body: ${text}`)

		if (response !== null && response !== undefined && typeof response.ok === 'boolean' && response.ok === false) {
			throw new Error(`ERROR: HTTP status ${response.status}`) // include body in error message for debugging
		}

		const rawContentType = response.headers.get('content-type') as string | string[] | null // handle possible array in content-type
		let contentType = ''
		// If the content-type header is not set, assume JSON
		if (typeof rawContentType === 'string') {
			if (this.debugLogging) console.log(`Content-Type: String`)
			contentType = rawContentType
		} else if (Array.isArray(rawContentType) && rawContentType.length > 0 && typeof rawContentType[0] === 'string') {
			if (this.debugLogging) console.log(`Content-Type: Array`)
			contentType = rawContentType[0]
		} else {
			if (this.debugLogging) console.log(`Content-Type: None`)
			contentType = ''
		}

		if (contentType.startsWith('application/json')) {
			if (this.debugLogging) console.log(`Content-Type: JSON`)
			return JSON.parse(text)
		} else {
			if (this.debugLogging) console.log(`Content-Type try to parse text to JSON: ${contentType}`)
			// HTML, text or XML-fallback
			const data = parseAttributeString(text)
			if (Object.keys(data).length > 0) {
				return { data } as T
			}
			try {
				if (this.debugLogging) console.log(`Content-Type: try JSON parsing`)
				return JSON.parse(text)
			} catch {
				throw new Error(`Unexpected content type: ${contentType}, and could not parse response`)
			}
		}
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
		if (this.tallyPollTimer) {
			clearInterval(this.tallyPollTimer)
			this.tallyPollTimer = null
		}
		this.#visca.close('Instance is being destroyed', InstanceStatus.Disconnected)
	}

	override async init(config: PtzOpticsConfig): Promise<void> {
		this.#logConfig(config, 'init()')

		this.setActionDefinitions(getActions(this))
		this.setPresetDefinitions(getPresets())
		return this.configUpdated(config)
	}

	override async configUpdated(config: PtzOpticsConfig): Promise<void> {
		this.#logConfig(config, 'configUpdated()')

		const oldOptions = this.#options

		const newOptions = optionsFromConfig(config)
		this.#options = newOptions

		if (canUpdateOptionsWithoutRestarting(oldOptions, newOptions)) {
			return
		}

		if (this.#options.host === null) {
			this.#visca.close('no host specified', InstanceStatus.Disconnected)
			return
		}
		// Initiate the connection (closing any prior connection), but don't
		// delay to fully establish it as `await this.#visca.connect()`
		// would, because network vagaries might make this take a long time.
		this.#visca.open(this.#options.host, this.#options.port)

		// HTTP Status
		if (this.tallyPollTimer) {
			clearInterval(this.tallyPollTimer)
			this.tallyPollTimer = null
		}
		const username = this.#options.httpUsername
		const password = this.#options.httpPassword

		let variableDefinitions: { variableId: string; name: string }[] = []
		let variableValues: Record<string, string | number | boolean> = {}
		let model = ''
		let devVersion = ''
		// get some informations at start
		if (this.#hasHttpCredentials(username, password)) {
			// device config
			try {
				;({ variableDefinitions, variableValues, model, devVersion } = await this.#fetchDeviceConfig(
					variableDefinitions,
					variableValues,
				))
			} catch (err) {
				this.log('error', `device config fetch failed: ${err}`)
				return this.init(config)
			}
			// check firmware version
			try {
				await this.#checkFirmwareVersion(model, devVersion, variableDefinitions, variableValues)
			} catch (err) {
				this.log('error', `PTZ Firmware fetch failed: ${err}`)
			}
			// start tally-polling, if interval > 0
			const interval = Number(config.httpPollInterval)
			if (interval > 0) {
				let isRequestInProgress = false
				let firstRun = true
				this.tallyPollTimer = setInterval(() => {
					void (async () => {
						if (isRequestInProgress) {
							this.log('info', 'Tally or image request already in progress')
							return
						}
						isRequestInProgress = true
						try {
							const { tallyDefs, tallyValues } = await this.#pollTallyStatus(firstRun)
							const { imageDefs, imageValues } = await this.#pollImageConfig(firstRun)
							if (firstRun) {
								this.setVariableDefinitions([...variableDefinitions, ...tallyDefs, ...imageDefs])
								firstRun = false
							}
							this.setVariableValues({
								...variableValues,
								...tallyValues,
								...imageValues,
							})
						} catch (err) {
							this.log('error', `Tally or image fetch failed: ${err}`)
						} finally {
							isRequestInProgress = false
						}
					})()
				}, interval)
			} else {
				this.setVariableDefinitions(variableDefinitions)
				this.setVariableValues(variableValues)
			}
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
	#logConfig(config: PtzOpticsConfig, desc = 'logConfig()'): void {
		this.log('info', `PTZOptics module configuration on ${desc}: ${repr(config)}`)
	}

	/**
	 * Check if the HTTP credentials are set.
	 *
	 * @param username
	 *    The HTTP username.
	 * @param password
	 *    The HTTP password.
	 * @returns
	 *    True if both username and password are set, false otherwise.
	 */
	#hasHttpCredentials(username: string | null, password: string | null): boolean {
		return typeof username === 'string' && username.length > 0 && typeof password === 'string' && password.length > 0
	}

	/**
	 * Fetch the device configuration from the camera.
	 * This method sends an HTTP GET request to the
	 * /cgi-bin/param.cgi?get_device_conf endpoint
	 * and retrieves the device configuration.
	 * It populates the provided variable definitions
	 * and values with the device configuration data.
	 * It also extracts the device model and version
	 * from the response data.
	 *
	 * @param variableDefinitions
	 *    The variable definitions to be populated with the device configuration.
	 * @param variableValues
	 *    The variable values to be populated with the device configuration.
	 * @returns
	 *    An object containing the updated variable definitions and values,
	 *    along with the model and device version.
	 */
	async #fetchDeviceConfig(
		variableDefinitions: { variableId: string; name: string }[],
		variableValues: Record<string, string | number | boolean>,
	): Promise<{
		variableDefinitions: typeof variableDefinitions
		variableValues: typeof variableValues
		model: string
		devVersion: string
	}> {
		const result = await this.sendHTTPCommand<{ data: any }>('/cgi-bin/param.cgi?get_device_conf', 'GET')
		if (this.debugLogging) this.log('debug', `Device config: ${repr(result)}`)
		let model = ''
		let devVersion = ''
		if (
			result !== undefined &&
			result !== null &&
			typeof result === 'object' &&
			'data' in result &&
			result.data !== undefined &&
			result.data !== null
		) {
			variableDefinitions = [
				{ name: 'HTTP Device Name', variableId: 'httpDevname' },
				{ name: 'HTTP Device Version', variableId: 'httpDevVersion' },
				{ name: 'HTTP Serial Number', variableId: 'httpSerialNum' },
				{ name: 'HTTP Device Model', variableId: 'httpDeviceModel' },
			]
			result.data.device_model = result.data.device_model.trim()
			model = result.data.device_model
			devVersion = result.data.versioninfo
			variableValues = {
				httpDevname: result.data.devname,
				httpDevVersion: devVersion,
				httpSerialNum: result.data.serial_num,
				httpDeviceModel: result.data.device_model,
			}
		}
		return { variableDefinitions, variableValues, model, devVersion }
	}

	/**
	 * Check the firmware version of the camera and update the variable definitions
	 * and values accordingly.
	 * This method fetches the firmware information from the
	 * https://firmware.ptzoptics.com/{model}/RVU.json endpoint,
	 * parses the response, and updates the variable definitions
	 * and values with the current firmware version.
	 * If the firmware version is different from the current device version,
	 * it logs a warning and updates the `httpDevUpdateable` variable
	 * with the new version.
	 * If the firmware is up to date, it logs an info message
	 * and sets `httpDevUpdateable` to 0.
	 *
	 * @param model
	 *    The model of the camera.
	 * @param devVersion
	 *    The current device version.
	 * @param variableDefinitions
	 *    The variable definitions to be updated.
	 * @param variableValues
	 *    The variable values to be updated.
	 */
	async #checkFirmwareVersion(
		model: string,
		devVersion: string,
		variableDefinitions: { variableId: string; name: string }[],
		variableValues: Record<string, string | number | boolean>,
	): Promise<void> {
		const digestClient2 = new DigestClient('', '')
		const result = await digestClient2.fetch(`https://firmware.ptzoptics.com/${model}/RVU.json`, {
			method: 'GET',
			headers: {
				'User-Agent': 'Mozilla/5.0',
				Accept: 'application/json',
			},
		})
		if (this.debugLogging) this.log('debug', `Firmware check: GET https://firmware.ptzoptics.com/${model}/RVU.json`)
		if (result !== null && result !== undefined && typeof result.ok === 'boolean' && result.ok === false) {
			throw new Error(`HTTP ${result.status}`)
		}
		const text = await result.text()
		if (this.debugLogging) this.log('debug', `Firmware check: ${repr(text)}`)
		let parsed: any
		if (text === '') {
			this.log('info', 'No firmware information available (empty response).')
			return
		} else {
			try {
				if (this.debugLogging) console.log(`Parsing firmware check response as JSON`)
				parsed = JSON.parse(text)
			} catch {
				//throw new Error(`Unexpected content type, could not parse JSON.`)
				this.log('info', 'No firmware information available (invalid JSON).')
				return
			}
		}
		const devVersionShort = devVersion.split(' v')[1] || ''
		variableDefinitions.push({ name: 'HTTP Device Updateable', variableId: 'httpDevUpdateable' })
		if (parsed.data.soc_version !== devVersionShort) {
			this.log(
				'warn',
				`Firmware update from ${devVersionShort} to ${parsed.data.soc_version} available. Changelog: https://firmware.ptzoptics.com/${model}/${parsed.data.log_name}`,
			)
			variableValues.httpDevUpdateable = parsed.data.soc_version
		} else {
			this.log('info', `Firmware is up to date: ${devVersionShort}`)
			variableValues.httpDevUpdateable = 0
		}
	}
	/**
	 * Poll the tally status from the camera.
	 * This method populates the provided tally definitions and values
	 * with the tally status data.
	 *
	 * @param firstRun
	 *    Indicates if this is the first run of the polling.
	 * @returns
	 *    An object containing the tally definitions and values.
	 */
	async #pollTallyStatus(
		firstRun: boolean,
	): Promise<{ tallyDefs: { variableId: string; name: string }[]; tallyValues: Record<string, string> }> {
		const result = await this.sendHTTPCommand<{ data: any }>('/cgi-bin/param.cgi?get_tally_status', 'GET')
		let tallyDefs: { variableId: string; name: string }[] = []
		const tallyValues: Record<string, string> = {}
		if (
			result !== undefined &&
			result !== null &&
			typeof result === 'object' &&
			'data' in result &&
			result.data !== undefined &&
			result.data !== null
		) {
			if (firstRun) {
				tallyDefs = Object.keys(result.data).map((key) => ({
					name: `HTTP ${key}`,
					variableId: `HTTP${key}`,
				}))
			}
			for (const [key, value] of Object.entries(result.data)) {
				tallyValues[`HTTP${key}`] = String(value)
			}
		}
		return { tallyDefs, tallyValues }
	}
	/**
	 * Poll the advancedimage configuration from the camera.
	 * This method fetches the advanced image configuration from the camera
	 * and updates the variable definitions and values accordingly.
	 *
	 * @param firstRun
	 *    Indicates if this is the first run of the polling.
	 * @returns
	 *   An object containing the image definitions and values.
	 */
	async #pollImageConfig(
		firstRun: boolean,
	): Promise<{ imageDefs: { variableId: string; name: string }[]; imageValues: Record<string, string> }> {
		const result = await this.sendHTTPCommand<{ data: any }>('/cgi-bin/param.cgi?get_advance_image_conf', 'GET')
		let imageDefs: { variableId: string; name: string }[] = []
		const imageValues: Record<string, string> = {}
		if (
			result !== undefined &&
			result !== null &&
			typeof result === 'object' &&
			'data' in result &&
			result.data !== undefined &&
			result.data !== null
		) {
			if (firstRun) {
				imageDefs = Object.keys(result.data).map((key) => ({
					name: `HTTP image ${key}`,
					variableId: `HTTPimage_${key}`,
				}))
			}
			for (const [key, value] of Object.entries(result.data)) {
				imageValues[`HTTPimage_${key}`] = String(value)
			}
		}
		return { imageDefs, imageValues }
	}
}
/**
 * Parses key="value" attribute strings from input text into an object.
 * Example input: foo="bar" baz="qux"
 * Returns: { foo: "bar", baz: "qux" }
 * @param input - The input string containing key="value" pairs.
 * @return An object mapping keys to their corresponding values.
 */
function parseAttributeString(input: string): Record<string, string> {
	const result: Record<string, string> = {}
	const regex = /(\w+)\s*=\s*"([^"]*)"/g
	let match

	while ((match = regex.exec(input)) !== null) {
		const key = match[1]
		const value = match[2]
		result[key] = value
	}

	return result
}
