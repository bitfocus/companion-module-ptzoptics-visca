import type { CompanionActionContext, CompanionOptionValues } from '@companion-module/base'
import { isValidPreset, twoDigitHex } from './camera/options.js'

/**
 * Given options for an action with a preset option that supports variables,
 * compute options that specify that preset numerically.\
 *
 * @param options
 *   Options from the action.
 * @param context
 *   The context supplied to the action.
 * @returns
 *   An error string if the preset isn't validly identified, or else an options
 *   object that specifies the preset as a number.
 */
export async function parsePresetVariableOption(
	options: CompanionOptionValues,
	context: CompanionActionContext
): Promise<CompanionOptionValues | string> {
	const presetStr = String(options.val)
	const preset = parseInt(await context.parseVariablesInString(presetStr), 10)

	if (Number.isNaN(preset) || !isValidPreset(preset)) {
		return `Invalid recall preset value of: ${presetStr}`
	} else {
		return { val: twoDigitHex(preset) }
	}
}
