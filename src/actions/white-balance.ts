import type { CompanionActionEvent } from '@companion-module/base'
import type { ActionDefinitions } from './actionid.js'
import {
	AutoWhiteBalanceSensitivity,
	AutoWhiteBalanceSensitivityLevel,
	WhiteBalance,
	WhiteBalanceMode,
	WhiteBalanceOnePushTrigger,
} from '../camera/white-balance.js'
import type { PtzOpticsInstance } from '../instance.js'
import { optionConversions, optionNullConversions } from './option-conversion.js'

export const WhiteBalanceActionId = {
	SelectWhiteBalance: 'wb',
	WhiteBalanceOnePushTrigger: 'wbOPT',
	SelectAutoWhiteBalanceSensitivity: 'awbS',
} as const

export type WhiteBalanceActionId = (typeof WhiteBalanceActionId)[keyof typeof WhiteBalanceActionId]

export const WhiteBalanceModeId = 'val'

const [getWhiteBalanceMode] = optionNullConversions<WhiteBalanceMode, typeof WhiteBalanceModeId>(
	WhiteBalanceModeId,
	[
		WhiteBalanceMode.Automatic,
		WhiteBalanceMode.Indoor,
		WhiteBalanceMode.Outdoor,
		WhiteBalanceMode.OnePush,
		WhiteBalanceMode.Manual,
	],
	WhiteBalanceMode.Automatic,
)

const AutoWhiteBalanceSensitivityId = 'val'

const [getAutoWhiteBalanceSensitivityLevel] = optionConversions<
	AutoWhiteBalanceSensitivityLevel,
	typeof AutoWhiteBalanceSensitivityId
>(
	AutoWhiteBalanceSensitivityId,
	[
		[0, AutoWhiteBalanceSensitivityLevel.High],
		[1, AutoWhiteBalanceSensitivityLevel.Normal],
		[2, AutoWhiteBalanceSensitivityLevel.Low],
	],
	AutoWhiteBalanceSensitivityLevel.Normal,
	1,
)

export function whiteBalanceActions(instance: PtzOpticsInstance): ActionDefinitions<WhiteBalanceActionId> {
	return {
		[WhiteBalanceActionId.SelectWhiteBalance]: {
			name: 'White balance',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: WhiteBalanceModeId,
					choices: [
						{ id: 'automatic', label: 'Automatic' },
						{ id: 'indoor', label: 'Indoor' },
						{ id: 'outdoor', label: 'Outdoor' },
						{ id: 'onepush', label: 'One Push' },
						{ id: 'manual', label: 'Manual' },
					],
					default: 'automatic',
				},
			],
			callback: async ({ options }) => {
				const mode = getWhiteBalanceMode(options)
				instance.sendCommand(WhiteBalance, { mode })
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
					id: AutoWhiteBalanceSensitivityId,
					choices: [
						{ id: 0, label: 'High' },
						{ id: 1, label: 'Middle' },
						{ id: 2, label: 'Low' },
					],
					default: 1,
				},
			],
			callback: async ({ options }) => {
				const level = getAutoWhiteBalanceSensitivityLevel(options)
				instance.sendCommand(AutoWhiteBalanceSensitivity, { level })
			},
		},
	}
}
