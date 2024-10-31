import { type InputValue, Regex, type SomeCompanionConfigField } from '@companion-module/base'

/**
 * The `TConfig` object type used to store instance configuration info.
 *
 * Nothing ensures that Companion config objects conform to the `TConfig` type
 * specified by a module.  Therefore we leave this type underdefined, not
 * well-defined, so that configuration info will be defensively processed.  (We
 * use `PtzOpticsOptions` to store configuration choices as well-typed values
 * for the long haul.  See the `options.ts:optionsFromConfig` destructuring
 * parameter for a list of the field/types we expect to find in config objects.)
 */
export interface PtzOpticsConfig {
	[key: string]: InputValue | undefined
}

/**
 * Test whether a config is missing the 'debugLogging' option that was added in
 * 3.0.0.
 */
export function configIsMissingDebugLogging(config: PtzOpticsConfig | null): config is PtzOpticsConfig {
	return config !== null && !('debugLogging' in config)
}

/**
 * Add the 'debugLogging' option (defaulting to false) to a pre-3.0.0 config
 * that's missing it.
 */
export function addDebugLoggingOptionToConfig(config: PtzOpticsConfig): void {
	config.debugLogging = false
}

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
			id: 'debugLogging',
			label: 'Log extra info during connection operations, for debugging purposes',
			default: false,
			width: 6,
		},
	]
}
