import type {
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionUpgradeContext,
} from '@companion-module/base'
import type { PtzOpticsConfig } from './config.js'
import {
	addCommandParameterOptionsToCustomCommandOptions,
	isCustomCommandMissingCommandParameterOptions,
} from './custom-command-action.js'

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
	props: CompanionStaticUpgradeProps<PtzOpticsConfig>
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

export const UpgradeScripts = [updateCustomCommandsWithCommandParamOptions]
