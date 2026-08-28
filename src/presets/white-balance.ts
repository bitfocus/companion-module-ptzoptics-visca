import type { CompanionPresetDefinitions } from '@companion-module/base'
import { WhiteBalanceActionId, WhiteBalanceModeId } from '../actions/white-balance.js'
import { Black, White } from '../utils/colors.js'

export function whiteBalancePresets(): CompanionPresetDefinitions {
	return {
		auto_white_balance_preset: {
			type: 'button',
			category: 'White balance',
			name: 'Auto White Balance',
			style: {
				text: 'WB\\nAUTO',
				size: '14',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: WhiteBalanceActionId.SelectWhiteBalance,
							options: {
								[WhiteBalanceModeId]: 'automatic',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		indoor_white_balance_preset: {
			type: 'button',
			category: 'White balance',
			name: 'Indoor White Balance',
			style: {
				text: 'WB\\nINDOOR',
				size: '14',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: WhiteBalanceActionId.SelectWhiteBalance,
							options: {
								[WhiteBalanceModeId]: 'indoor',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		outdoor_white_balance_preset: {
			type: 'button',
			category: 'White balance',
			name: 'Outdoor White Balance',
			style: {
				text: 'WB\\nOUT\\nDOOR',
				size: '14',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: WhiteBalanceActionId.SelectWhiteBalance,
							options: {
								[WhiteBalanceModeId]: 'outdoor',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		one_push_white_balance_preset: {
			type: 'button',
			category: 'White balance',
			name: 'One Push White Balance',
			style: {
				text: 'WB\\nONE PUSH',
				size: '14',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: WhiteBalanceActionId.SelectWhiteBalance,
							options: {
								[WhiteBalanceModeId]: 'onepush',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		trigger_one_push_white_balance_preset: {
			type: 'button',
			category: 'White balance',
			name: 'Trigger One Push White Balance',
			style: {
				text: 'WB\\nTRIGGER\\nONE PUSH',
				size: '14',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: WhiteBalanceActionId.WhiteBalanceOnePushTrigger,
							options: {},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},
	}
}
