import type { CompanionPresetDefinitions } from '@companion-module/base'
import { AutoTrackingActionId, TrackingId } from '../actions/auto-tracking.js'
import { Black, White } from '../utils/colors.js'

export function autoTrackingPresets(): CompanionPresetDefinitions {
	return {
		auto_tracking_on: {
			type: 'button',
			category: 'Auto Tracking',
			name: 'Auto Tracking On',
			style: {
				text: 'Auto\\nTracking\\nOn',
				size: '14',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: AutoTrackingActionId.AutoTracking,
							options: {
								[TrackingId]: 'on',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		auto_tracking_off: {
			type: 'button',
			category: 'Auto Tracking',
			name: 'Auto Tracking Off',
			style: {
				text: 'Auto\\nTracking\\nOff',
				size: '14',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: AutoTrackingActionId.AutoTracking,
							options: {
								[TrackingId]: 'off',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},
	}
}
