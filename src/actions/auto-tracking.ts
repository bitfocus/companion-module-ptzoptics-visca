import type { ActionDefinitions } from './actionid.js'
import { AutoTracking, AutoTrackingState } from '../camera/auto-tracking.js'
import type { PtzOpticsInstance } from '../instance.js'
import { optionNullConversions } from './option-conversion.js'

export const AutoTrackingActionId = {
	AutoTracking: 'autoTracking',
} as const

export type AutoTrackingActionId = (typeof AutoTrackingActionId)[keyof typeof AutoTrackingActionId]

export const TrackingId = 'tracking'

const [getAutoTrackingState] = optionNullConversions<AutoTrackingState, typeof TrackingId>(
	TrackingId,
	[AutoTrackingState.Off, AutoTrackingState.On],
	AutoTrackingState.Off,
)

export function autoTrackingActions(instance: PtzOpticsInstance): ActionDefinitions<AutoTrackingActionId> {
	return {
		[AutoTrackingActionId.AutoTracking]: {
			name: 'Auto Tracking',
			options: [
				{
					type: 'dropdown',
					label: 'Auto tracking (PTZ Optics G3 model required)',
					id: TrackingId,
					choices: [
						{ id: 'off', label: 'Off' },
						{ id: 'on', label: 'On' },
					],
					default: 'off',
				},
			],
			callback: async ({ options }) => {
				const state = getAutoTrackingState(options)
				instance.sendCommand(AutoTracking, { state })
			},
		},
	}
}
