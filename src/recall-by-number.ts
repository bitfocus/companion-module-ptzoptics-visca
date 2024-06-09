import { CompanionOptionValues } from '@companion-module/base'
import { isValidPreset, twoDigitHex } from './camera/options.js'
//import { PtzOpticsInstance } from './instance.js'
import { CompanionCommonCallbackContext } from '@companion-module/base/dist/module-api/common.js'

/**
 *
 * @param options options from the action event
 * @param context
 * @returns CompanionOptionValues if the val resolves to a valid preset or a string error if
 *          resolved to an invalid preset or something that isn't a number
 */
export async function parsePresetVariableOption(
	options: CompanionOptionValues,
	context: CompanionCommonCallbackContext
): Promise<CompanionOptionValues | string> {
	const varPreset = await context.parseVariablesInString(String(options.val))
	const preset = parseInt(varPreset, 10)

	if (Number.isNaN(preset) || !isValidPreset(preset)) {
		return 'Invalid recall preset value of: ' + options.val
	} else {
		return { val: twoDigitHex(preset) }
	}
}
