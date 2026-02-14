import type {
	CompanionMigrationAction,
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
} from '@companion-module/base'
import { tryUpdateCustomCommandsWithCommandParamOptions } from './actions/custom-command.js'
import { tryUpdatePresetAndSpeedEncodingsInActions, tryUpdateRecallSetPresetActions } from './actions/presets.js'
import { type RawConfig, tryUpdateConfigWithDebugLogging } from './config.js'

function ActionUpdater(
	tryUpdate: (action: CompanionMigrationAction) => boolean,
): CompanionStaticUpgradeScript<RawConfig> {
	return (_context: CompanionUpgradeContext<RawConfig>, props: CompanionStaticUpgradeProps<RawConfig>) => {
		return {
			updatedActions: props.actions.filter(tryUpdate),
			updatedConfig: null,
			updatedFeedbacks: [],
		}
	}
}

function ConfigUpdater(tryUpdate: (config: RawConfig) => boolean): CompanionStaticUpgradeScript<RawConfig> {
	return (_context: CompanionUpgradeContext<RawConfig>, props: CompanionStaticUpgradeProps<RawConfig>) => {
		return {
			updatedActions: [],
			updatedConfig: props.config !== null && tryUpdate(props.config) ? props.config : null,
			updatedFeedbacks: [],
		}
	}
}

export const UpgradeScripts = [
	ActionUpdater(tryUpdateCustomCommandsWithCommandParamOptions),
	ConfigUpdater(tryUpdateConfigWithDebugLogging),
	ActionUpdater(tryUpdateRecallSetPresetActions),
	ActionUpdater(tryUpdatePresetAndSpeedEncodingsInActions),
] satisfies CompanionStaticUpgradeScript<RawConfig>[]
