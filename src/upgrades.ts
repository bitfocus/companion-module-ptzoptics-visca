import type {
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionUpgradeContext,
} from '@companion-module/base'
import {
	addCommandParameterOptionsToCustomCommandOptions,
	isCustomCommandMissingCommandParameterOptions,
} from './actions/custom-command.js'
import { addDebugLoggingOptionToConfig, configIsMissingDebugLogging, type PtzOpticsConfig } from './config.js'

/**
 * At one time, the "Custom command" action took only a single option with id
 * "custom" specifying the bytes to send -- and no user-defined parameters.
 *
 * Now, the "Custom command" action supports user-defined parameters in the
 * command being sent.
 *
 * Add the missing options that would specify that this command has no
 * user-defined parameters.
 */
function updateCustomCommandsWithCommandParamOptions(
	_context: CompanionUpgradeContext<PtzOpticsConfig>,
	props: CompanionStaticUpgradeProps<PtzOpticsConfig>,
): CompanionStaticUpgradeResult<PtzOpticsConfig> {
	const result: CompanionStaticUpgradeResult<PtzOpticsConfig> = {
		updatedActions: [],
		updatedConfig: null,
		updatedFeedbacks: [],
	}

	for (const action of props.actions) {
		if (isCustomCommandMissingCommandParameterOptions(action)) {
			addCommandParameterOptionsToCustomCommandOptions(action.options)

			result.updatedActions.push(action)
		}
	}

	return result
}

/**
 * A config option was added in 3.0.0 to turn on extra logging to Companion's
 * logs, to make it easier to debug the module in case of error.  Add a default
 * value for that option to older configs.
 */
function addDebugLoggingConfigIfMissing(
	_context: CompanionUpgradeContext<PtzOpticsConfig>,
	props: CompanionStaticUpgradeProps<PtzOpticsConfig>,
): CompanionStaticUpgradeResult<PtzOpticsConfig> {
	const result: CompanionStaticUpgradeResult<PtzOpticsConfig> = {
		updatedActions: [],
		updatedConfig: null,
		updatedFeedbacks: [],
	}

	if (configIsMissingDebugLogging(props.config)) {
		addDebugLoggingOptionToConfig(props.config)

		result.updatedConfig = props.config
	}

	return result
}

export const UpgradeScripts = [updateCustomCommandsWithCommandParamOptions, addDebugLoggingConfigIfMissing]
