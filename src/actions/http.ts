import type { ActionDefinitions } from './actionid.js'
import type { PtzOpticsInstance } from '../instance.js'
import { HTTPReboot } from '../camera/http.js'

export enum HTTPActionId {
	reboot = 'HTTPReboot',
}

export function HTTPActions(instance: PtzOpticsInstance): ActionDefinitions<HTTPActionId> {
	return {
		[HTTPActionId.reboot]: {
			name: 'Reboot',
			description: 'HTTP authentication in config needed',
			options: [],
			callback: async () => {
				await instance.sendHTTPCommand<{ data: any }>(HTTPReboot, 'POST')
			},
		},
	}
}
