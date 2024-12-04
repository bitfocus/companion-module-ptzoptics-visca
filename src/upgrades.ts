import type {
	CompanionMigrationAction,
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
} from '@companion-module/base'
import { tryUpdateCustomCommandsWithCommandParamOptions } from './actions/custom-command.js'
import { addDebugLoggingOptionToConfig, configIsMissingDebugLogging, type PtzOpticsConfig } from './config.js'

function ActionUpdater(
	tryUpdate: (action: CompanionMigrationAction) => boolean,
): CompanionStaticUpgradeScript<PtzOpticsConfig> {
	return (_context: CompanionUpgradeContext<PtzOpticsConfig>, props: CompanionStaticUpgradeProps<PtzOpticsConfig>) => {
		return {
			updatedActions: props.actions.filter(tryUpdate),
			updatedConfig: null,
			updatedFeedbacks: [],
		}
	}
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

export const UpgradeScripts = [
	ActionUpdater(tryUpdateCustomCommandsWithCommandParamOptions),
	addDebugLoggingConfigIfMissing,
]
