import { type InputValue, Regex, type SomeCompanionConfigField } from '@companion-module/base'
import type { Branded } from './utils/brand.js'

/**
 * The `TConfig` object type used to store instance configuration info.
 *
 * Nothing ensures that Companion config objects conform to the `TConfig` type
 * specified by a module.  Therefore we leave this type underdefined, not
 * well-defined, so that configuration info will be defensively processed.  (We
 * use `PtzOpticsConfig` to ensure configuration data is well-typed.  See
 * `validateConfig` for details.)
 */
export interface RawConfig {
	[key: string]: InputValue | undefined
}

/** The id of the debug-logging config option. */
export const DebugLoggingOptionId = 'debugLogging'

/**
 * A config option was added in 3.0.0 to turn on extra logging to Companion's
 * logs, to make it easier to debug the module in case of error.  Add a default
 * value for that option to older configs.
 */
export function tryUpdateConfigWithDebugLogging(config: RawConfig): boolean {
	if (!(DebugLoggingOptionId in config)) {
		config[DebugLoggingOptionId] = false
		return true
	}

	return false
}

/** Compute the config fields list for this module. */
export function getConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module controls PTZ cameras with VISCA over IP protocol',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Camera IP',
			width: 6,
			default: '',
			regex: Regex.IP,
			required: true,
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'VISCA TCP port',
			width: 6,
			default: '5678',
			regex: Regex.PORT,
			required: true,
		},
		{
			type: 'checkbox',
			id: DebugLoggingOptionId,
			label: 'Log extra info during connection operations, for debugging purposes',
			default: false,
			width: 6,
		},
	]
}

/** Validated config information for the camera connection being manipulated. */
export type PtzOpticsConfig = {
	/** The TCP/IP IP address of the camera, or a non-IP address string. */
	host: string

	/** The TCP/IP port used to connect to the camera. */
	port: number

	/**
	 * Whether to perform debug logging of extensive details concerning the
	 * connection: messages sent and received, internal command/inquiry/reply
	 * handling state, etc.
	 */
	[DebugLoggingOptionId]: boolean
}

/**
 * Instance config suitable for use at instance creation before initialization
 * with an actual config.
 */
export function noCameraConfig(): PtzOpticsConfig {
	return {
		// Empty host ensures that these options won't trigger a connection.
		host: '',
		port: DefaultPort,
		debugLogging: false,
	}
}

/**
 * Validate `config` as validly-encoded options, massaging options into type
 * conformance as necessary.
 */
export function validateConfig(config: RawConfig): asserts config is PtzOpticsConfig {
	config.host = toHost(config.host)
	config.port = toPort(config.port)
	config[DebugLoggingOptionId] = toDebugLogging(config[DebugLoggingOptionId])
}

const ipRegExp = new RegExp(Regex.IP.slice(1, -1))

/** A valid hostname as well-formed IP address. */
export type Host = Branded<string, 'config-host-valid-ip'>

/** Determine whether the supplied string is a valid hostname. */
export function isValidHost(str: string): str is Host {
	return ipRegExp.test(str)
}

function toHost(host: RawConfig['host']): string {
	if (host !== undefined) {
		const str = String(host)
		if (isValidHost(str)) {
			return str
		}
	}

	return ''
}

const DefaultPort = 5678

const portRegExp = new RegExp(Regex.PORT.slice(1, -1))

function toPort(port: RawConfig['port']): number {
	if (port !== undefined) {
		const portStr = String(port)
		if (portRegExp.test(portStr)) {
			return Number(portStr)
		}
	}

	return DefaultPort
}

const toDebugLogging = Boolean

/**
 * For an already-started instance/connection using the given old config,
 * determine whether applying the new config to it requires restarting the
 * connection.
 */
export function canUpdateConfigWithoutRestarting(oldConfig: PtzOpticsConfig, newConfig: PtzOpticsConfig): boolean {
	// A different host or port straightforwardly requires a connection restart.
	if (oldConfig.host !== newConfig.host || oldConfig.port !== newConfig.port) {
		return false
	}

	// Debug logging can be turned on or off at runtime without restarting.

	// Otherwise we can update config without restarting.
	return true
}
