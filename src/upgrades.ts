import type {
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionUpgradeContext,
} from '@companion-module/base'
import type { PtzOpticsConfig } from './config.js'
import {
	addCommandParametersAndResponseToCustomCommandOptions,
	isCustomCommandMissingCommandParametersAndResponse,
} from './custom-command-action.js'

/**
 * At one time, the "Custom command" action took only a single option with id
 * "custom" specifying the bytes to send.
 *
 * Now, the "Custom command" action supports user-defined parameters in the
 * command being sent and an expected series of responses through a bunch of
 * added option ids.
 *
 * Add plausible default values for all those new option ids to old-school
 * `options` that lack them.
 */
function updateCustomCommandsWithParamsAndResponses(
	_context: CompanionUpgradeContext<PtzOpticsConfig>,
	props: CompanionStaticUpgradeProps<PtzOpticsConfig>
): CompanionStaticUpgradeResult<PtzOpticsConfig> {
	const result: CompanionStaticUpgradeResult<PtzOpticsConfig> = {
		updatedActions: [],
		updatedConfig: null,
		updatedFeedbacks: [],
	}

	for (const action of props.actions) {
		if (isCustomCommandMissingCommandParametersAndResponse(action)) {
			addCommandParametersAndResponseToCustomCommandOptions(action.options)

			result.updatedActions.push(action)
		}
	}

	return result
}

export const UpgradeScripts = [updateCustomCommandsWithParamsAndResponses]
