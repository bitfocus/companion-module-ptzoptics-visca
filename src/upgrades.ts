import type {
	CompanionMigrationAction,
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
} from '@companion-module/base'
import { tryUpdateCustomCommandsWithCommandParamOptions } from './actions/custom-command.js'
import { tryUpdateRecallSetPresetActions } from './actions/presets.js'
import { tryUpdateConfigWithDebugLogging, type PtzOpticsConfig } from './config.js'

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

function ConfigUpdater(
	tryUpdate: (config: PtzOpticsConfig | null) => boolean,
): CompanionStaticUpgradeScript<PtzOpticsConfig> {
	return (_context: CompanionUpgradeContext<PtzOpticsConfig>, props: CompanionStaticUpgradeProps<PtzOpticsConfig>) => {
		return {
			updatedActions: [],
			updatedConfig: tryUpdate(props.config) ? props.config : null,
			updatedFeedbacks: [],
		}
	}
}

export const UpgradeScripts = [
	ActionUpdater(tryUpdateCustomCommandsWithCommandParamOptions),
	ConfigUpdater(tryUpdateConfigWithDebugLogging),
	ActionUpdater(tryUpdateRecallSetPresetActions),
]
