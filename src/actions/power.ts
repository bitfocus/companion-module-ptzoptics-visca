import type { ActionDefinitions } from './actionid.js'
import type { PtzOpticsInstance } from '../instance.js'
import { CameraPower, type CameraPowerState } from '../camera/power.js'
import { optionConversions } from './option-conversion.js'

export enum PowerActionId {
	CameraPowerState = 'power',
}

const PowerStateId = 'bool'

const [getPowerState] = optionConversions<CameraPowerState, typeof PowerStateId>(
	PowerStateId,
	[
		['off', 'standby'],
		['on', 'on'],
	],
	'on',
	'on',
)

export function powerActions(instance: PtzOpticsInstance): ActionDefinitions<PowerActionId> {
	return {
		[PowerActionId.CameraPowerState]: {
			name: 'Power Camera',
			options: [
				{
					type: 'dropdown',
					label: 'Power on/standby',
					id: PowerStateId,
					choices: [
						{ id: 'off', label: 'Standby' },
						{ id: 'on', label: 'On' },
					],
					default: 'on',
				},
			],
			callback: async ({ options }) => {
				const state = getPowerState(options)
				instance.sendCommand(CameraPower, { state })
			},
		},
	}
}
