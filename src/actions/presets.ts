import type {
	CompanionActionContext,
	CompanionActionEvent,
	CompanionInputFieldCheckbox,
	CompanionInputFieldTextInput,
	CompanionMigrationAction,
	CompanionOptionValues,
} from '@companion-module/base'
import type { ActionDefinitions } from './actionid.js'
import { PresetDriveSpeed, PresetRecall, PresetSave } from '../camera/commands.js'
import {
	isValidPreset,
	PresetDriveNumberOption,
	PresetDriveSpeedOption,
	PresetRecallDefault,
	PresetRecallOption,
	PresetSaveOption,
	PresetSetDefault,
	PresetValueOptionId,
	twoDigitHex,
} from '../camera/options.js'
import type { PtzOpticsInstance } from '../instance.js'
import { repr } from '../utils/repr.js'

export enum PresetActionId {
	RecallPset = 'recallPset',
	SavePset = 'savePset',
	SetPresetDriveSpeed = 'speedPset',
}

/**
 * The action ID of an obsolete action that would set a preset identified by a
 * textinput whose contents would be parsed for variable references -- replaced
 * with an action that allows specifying the preset from dropdown or textually.
 */
export const ObsoleteSavePsetFromVar = 'savePsetFromVar'

/**
 * The action ID of an obsolete action that would recall a preset identified by
 * a textinput whose contents would be parsed for variable references --
 * replaced with an action that allows specifying the preset from dropdown or
 * textually.
 */
export const ObsoleteRecallPsetFromVar = 'recallPsetFromVar'

/**
 * The id of the use-variables option checkbox for preset recall/save actions.
 */
export const PresetUseVariablesOptionId = 'useVariables'

/**
 * The id of the option defining a variables-supporting textinput to specify the
 * preset in preset recall/save actions, when the use-variables checkbox is
 * checked.
 */
export const PresetVariableOptionId = 'presetVariable'

/**
 * If the entirety of `s` is a decimal number, return it.  Otherwise return
 * `NaN`.
 */
function parseCompleteDecimal(s: string): number {
	// `parseInt` can't be directly used because it'll parse a mere prefix of
	// decimal numbers.
	return /^\d+$/.test(s) ? parseInt(s, 10) : NaN
}

/**
 * Given a migration action, if it's a preset recall/save action with the preset
 * specified *only* by dropdown or *only* by textinput that supports variable
 * references, rewrite it into an action that supports either specification
 * method (with the intended one controlled by a newly-added checkbox) and
 * return true.  Otherwise return false.
 *
 *     // by dropdown
 *     { val: twoDigitHex(N) }⇒
 *     { useVariables: false, val: twoDigitHex(N), presetVariable: <default> }
 *
 *     // by textinput supporting variables
 *     { val: "..." } ⇒
 *     { useVariables: true, val: <default>, presetVariable: "..." }
 *
 * @returns
 *   Whether the action was a preset recall/save action that was rewritten.
 */
export function tryUpdateRecallSetPresetActions(action: CompanionMigrationAction): boolean {
	const { actionId, options } = action
	switch (actionId) {
		case ObsoleteRecallPsetFromVar: {
			action.actionId = PresetActionId.RecallPset
			options[PresetUseVariablesOptionId] = true

			const textinput = String(options[PresetValueOptionId])
			options[PresetVariableOptionId] = textinput

			const n = parseCompleteDecimal(textinput)
			options[PresetValueOptionId] = twoDigitHex(isValidPreset(n) ? n : PresetRecallDefault)
			return true
		}

		case ObsoleteSavePsetFromVar: {
			action.actionId = PresetActionId.SavePset
			options[PresetUseVariablesOptionId] = true

			const textinput = String(options[PresetValueOptionId])
			options[PresetVariableOptionId] = textinput

			const n = parseCompleteDecimal(textinput)
			options[PresetValueOptionId] = twoDigitHex(isValidPreset(n) ? n : PresetSetDefault)
			return true
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		case PresetActionId.RecallPset:
			if (!(PresetUseVariablesOptionId in options)) {
				options[PresetUseVariablesOptionId] = false

				const n = parseInt(String(options[PresetValueOptionId]), 16)
				options[PresetVariableOptionId] = String(isValidPreset(n) ? n : PresetRecallDefault)
				return true
			}
			return false

		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		case PresetActionId.SavePset:
			if (!(PresetUseVariablesOptionId in options)) {
				options[PresetUseVariablesOptionId] = false

				const n = parseInt(String(options[PresetValueOptionId]), 16)
				options[PresetVariableOptionId] = String(isValidPreset(n) ? n : PresetSetDefault)
				return true
			}
			return false

		default:
			return false
	}
}

/**
 * An `isVisible` function used with preset recall/save action options that
 * apply when the user has chosen to specify the preset using variables.
 *
 * @param options
 *   The options specified by the user for the action.
 * @returns
 *   Whether `options` specifies to use the variable-supporting text input.
 */
function OptionWithVariablesIsVisible(options: CompanionOptionValues): boolean {
	// Don't use `PresetUseVariablesOptionId` because this function can't depend
	// on enclosing-scope names.
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	return !!options.useVariables
}

/**
 * An `isVisible` function used with preset recall/save action options that
 * apply when the user has chosen to specify the preset *not* using variables.
 *
 * @param options
 *   The options specified by the user for the action.
 * @returns
 *   Whether `options` specifies not to use the variable-supporting text input.
 */
function OptionWithoutVariablesIsVisible(options: CompanionOptionValues): boolean {
	// Don't use `PresetUseVariablesOptionId` because this function can't depend
	// on enclosing-scope names.
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	return !options.useVariables
}

/**
 * Given options for an action with a preset option that supports variables,
 * compute command options that specify that preset numerically.
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
	context: CompanionActionContext,
): Promise<CompanionOptionValues | string> {
	const presetStr = String(options[PresetVariableOptionId])
	const useVariables = Boolean(options[PresetUseVariablesOptionId])
	if (!useVariables) {
		return `Improperly attempted to parse preset value when not using variables: ${presetStr}`
	}

	const preset = parseCompleteDecimal(await context.parseVariablesInString(presetStr))
	if (!isValidPreset(preset)) {
		return `Invalid recall preset value of: ${repr(presetStr)}`
	} else {
		return { [PresetValueOptionId]: twoDigitHex(preset) }
	}
}

export function presetActions(instance: PtzOpticsInstance): ActionDefinitions<PresetActionId> {
	const PresetUseVariablesOption: CompanionInputFieldCheckbox = {
		type: 'checkbox',
		label: 'Use variables for preset',
		id: PresetUseVariablesOptionId,
		default: false,
	} as const

	function presetNumberTextInput(defaultPreset: number): CompanionInputFieldTextInput {
		return {
			type: 'textinput',
			label: 'Preset number',
			id: PresetVariableOptionId,
			useVariables: true,
			tooltip: 'Preset number range of 0-89, 100-254',
			default: `${defaultPreset}`,
			isVisible: OptionWithVariablesIsVisible,
		}
	}

	return {
		[PresetActionId.SavePset]: {
			name: 'Save Preset',
			options: [
				PresetUseVariablesOption,
				{
					type: 'dropdown',
					label: 'Preset number',
					id: PresetSaveOption.id,
					choices: PresetSaveOption.choices,
					minChoicesForSearch: 1,
					default: twoDigitHex(PresetSetDefault),
					isVisible: OptionWithoutVariablesIsVisible,
				},
				presetNumberTextInput(PresetSetDefault),
			],
			callback: async ({ options }, context) => {
				const useVariableOption = Boolean(options[PresetUseVariablesOptionId])
				let commandOpts
				if (useVariableOption) {
					commandOpts = await parsePresetVariableOption(options, context)
					if (typeof commandOpts === 'string') {
						instance.log('error', commandOpts)
						return
					}
				} else {
					commandOpts = options
				}
				instance.sendCommand(PresetSave, commandOpts)
			},
		},
		[PresetActionId.RecallPset]: {
			name: 'Recall Preset',
			options: [
				PresetUseVariablesOption,
				{
					type: 'dropdown',
					label: 'Preset number',
					id: PresetRecallOption.id,
					choices: PresetRecallOption.choices,
					minChoicesForSearch: 1,
					default: twoDigitHex(PresetRecallDefault),
					isVisible: OptionWithoutVariablesIsVisible,
				},
				presetNumberTextInput(PresetRecallDefault),
			],
			callback: async ({ options }, context) => {
				const useVariableOption = Boolean(options[PresetUseVariablesOptionId])
				let commandOpts
				if (useVariableOption) {
					commandOpts = await parsePresetVariableOption(options, context)
					if (typeof commandOpts === 'string') {
						instance.log('error', commandOpts)
						return
					}
				} else {
					commandOpts = options
				}
				instance.sendCommand(PresetRecall, commandOpts)
			},
		},
		[PresetActionId.SetPresetDriveSpeed]: {
			name: 'Preset Drive Speed',
			options: [
				{
					type: 'dropdown',
					label: 'Preset number',
					id: PresetDriveNumberOption.id,
					choices: PresetDriveNumberOption.choices,
					minChoicesForSearch: 1,
					default: PresetDriveNumberOption.default,
				},
				{
					type: 'dropdown',
					label: 'Speed setting',
					id: PresetDriveSpeedOption.id,
					choices: PresetDriveSpeedOption.choices,
					minChoicesForSearch: 1,
					default: PresetDriveSpeedOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(PresetDriveSpeed, event.options)
			},
		},
	}
}
