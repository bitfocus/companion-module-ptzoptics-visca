import type { CompanionActionContext, CompanionActionEvent, CompanionOptionValues } from '@companion-module/base'
import type { ActionDefinitions } from './actionid.js'
import { PresetDriveSpeed, PresetRecall, PresetSave } from '../camera/commands.js'
import {
	isValidPreset,
	PresetDriveNumberOption,
	PresetSaveOption,
	PresetDriveSpeedOption,
	twoDigitHex,
	PresetRecallOption,
} from '../camera/options.js'
import type { PtzOpticsInstance } from '../instance.js'

export enum PresetActionId {
	SetPreset = 'savePset',
	SetPresetFromVar = 'savePsetFromVar',
	RecallPreset = 'recallPset',
	RecallPresetFromVar = 'recallPsetFromVar',
	SetPresetDriveSpeed = 'speedPset',
}

/**
 * Given options for an action with a preset option that supports variables,
 * compute options that specify that preset numerically.
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
	const presetStr = String(options.val)
	const preset = parseInt(await context.parseVariablesInString(presetStr), 10)

	if (Number.isNaN(preset) || !isValidPreset(preset)) {
		return `Invalid recall preset value of: ${presetStr}`
	} else {
		return { val: twoDigitHex(preset) }
	}
}

export function presetActions(instance: PtzOpticsInstance): ActionDefinitions<PresetActionId> {
	return {
		[PresetActionId.SetPreset]: {
			name: 'Save Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset number',
					id: PresetSaveOption.id,
					choices: PresetSaveOption.choices,
					minChoicesForSearch: 1,
					default: PresetSaveOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(PresetSave, event.options)
			},
		},
		[PresetActionId.SetPresetFromVar]: {
			name: 'Save Preset (by number)',
			options: [
				{
					type: 'textinput',
					label: 'Preset number',
					id: PresetSaveOption.id,
					useVariables: true,
					tooltip: 'Preset number range of 0-89, 100-254',
					default: '0',
				},
			],
			callback: async ({ options }, context) => {
				const errorOrValue = await parsePresetVariableOption(options, context)
				if (typeof errorOrValue === 'string') {
					instance.log('error', errorOrValue)
				} else {
					instance.sendCommand(PresetSave, errorOrValue)
				}
			},
		},
		[PresetActionId.RecallPreset]: {
			name: 'Recall Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset number',
					id: PresetRecallOption.id,
					choices: PresetRecallOption.choices,
					minChoicesForSearch: 1,
					default: PresetRecallOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(PresetRecall, event.options)
			},
		},
		[PresetActionId.RecallPresetFromVar]: {
			name: 'Recall Preset (by number)',
			options: [
				{
					type: 'textinput',
					label: 'Preset number',
					id: PresetRecallOption.id,
					useVariables: true,
					tooltip: 'Preset number range of 0-89, 100-254',
					default: '0',
				},
			],
			callback: async ({ options }, context) => {
				const errorOrValue = await parsePresetVariableOption(options, context)
				if (typeof errorOrValue === 'string') {
					instance.log('error', errorOrValue)
				} else {
					instance.sendCommand(PresetRecall, errorOrValue)
				}
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
