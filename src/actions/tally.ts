import type { ActionDefinitions } from './actionid.js'
import type { PtzOpticsInstance } from '../instance.js'

export enum TallyActionId {
	TallyMode = 'httpTallyMode',
}

export function tallyActions(instance: PtzOpticsInstance): ActionDefinitions<TallyActionId> {
	return {
		[TallyActionId.TallyMode]: {
			name: 'Tally light',
			description: 'HTTP authentication in config needed. (Models Move 4K and Link 4K only)',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'tallyMode',
					choices: [
						{ id: '2', label: 'On' },
						{ id: '3', label: 'Off' },
					],
					default: '2',
				},
			],
			callback: async ({ options }) => {
				await instance.sendHTTPCommand('/cgi-bin/param.cgi?post_image_value&tallymode&' + options.tallyMode, 'POST')
			},
		},
	}
}
