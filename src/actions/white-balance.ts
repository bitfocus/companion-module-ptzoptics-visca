import type { CompanionActionDefinition, CompanionActionEvent } from '@companion-module/base'
import { AutoWhiteBalanceSensitivity, WhiteBalance, WhiteBalanceOnePushTrigger } from '../camera/commands.js'
import { AutoWhiteBalanceSensitivityOption, WhiteBalanceOption } from '../camera/options.js'
import type { PtzOpticsInstance } from '../instance.js'

export enum WhiteBalanceActionId {
	SelectWhiteBalance = 'wb',
	WhiteBalanceOnePushTrigger = 'wbOPT',
	SelectAutoWhiteBalanceSensitivity = 'awbS',
}

export function whiteBalanceActions(
	instance: PtzOpticsInstance,
): Record<WhiteBalanceActionId, CompanionActionDefinition> {
	return {
		[WhiteBalanceActionId.SelectWhiteBalance]: {
			name: 'White balance',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: WhiteBalanceOption.id,
					choices: WhiteBalanceOption.choices,
					default: WhiteBalanceOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(WhiteBalance, event.options)
			},
		},
		[WhiteBalanceActionId.WhiteBalanceOnePushTrigger]: {
			name: 'White balance one push trigger',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(WhiteBalanceOnePushTrigger)
			},
		},
		[WhiteBalanceActionId.SelectAutoWhiteBalanceSensitivity]: {
			name: 'Auto white balance sensitivity',
			options: [
				{
					type: 'dropdown',
					label: 'Sensitivity',
					id: AutoWhiteBalanceSensitivityOption.id,
					choices: AutoWhiteBalanceSensitivityOption.choices,
					default: AutoWhiteBalanceSensitivityOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(AutoWhiteBalanceSensitivity, event.options)
			},
		},
	}
}
