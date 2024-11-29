import type { CompanionActionEvent } from '@companion-module/base'
import { type ActionDefinitions, type OtherActionId, OtherActionId as PtzOpticsActionId } from './actionid.js'
import { AutoTracking, CameraPower } from '../camera/commands.js'
import { AutoTrackingOption, CameraPowerOption } from '../camera/options.js'
import type { PtzOpticsInstance } from '../instance.js'

export function otherActions(instance: PtzOpticsInstance): ActionDefinitions<OtherActionId> {
	return {
		[PtzOpticsActionId.CameraPowerState]: {
			name: 'Power Camera',
			options: [
				{
					type: 'dropdown',
					label: 'Power on/standby',
					id: CameraPowerOption.id,
					choices: CameraPowerOption.choices,
					default: CameraPowerOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(CameraPower, event.options)
			},
		},
		[PtzOpticsActionId.AutoTracking]: {
			name: 'Auto Tracking',
			options: [
				{
					type: 'dropdown',
					label: 'Auto tracking (PTZ Optics G3 model required)',
					id: AutoTrackingOption.id,
					choices: AutoTrackingOption.choices,
					default: AutoTrackingOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(AutoTracking, event.options)
			},
		},
	}
}
