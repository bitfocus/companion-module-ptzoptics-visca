import type { ActionDefinitions } from './actionid.js'
import { AutoTracking, type AutoTrackingState } from '../camera/auto-tracking.js'
import type { PtzOpticsInstance } from '../instance.js'
import { optionNullConversions } from './option-conversion.js'

export enum AutoTrackingActionId {
	AutoTracking = 'autoTracking',
}

const TrackingId = 'tracking'

const [getAutoTrackingState] = optionNullConversions<AutoTrackingState, typeof TrackingId>(
	TrackingId,
	['off', 'on'],
	'off',
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
