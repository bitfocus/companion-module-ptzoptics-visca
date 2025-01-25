import type { CompanionActionEvent } from '@companion-module/base'
import type { ActionDefinitions } from './actionid.js'
import { ZoomIn, ZoomOut, ZoomStop } from '../camera/zoom.js'
import type { PtzOpticsInstance } from '../instance.js'

export enum ZoomActionId {
	StartZoomIn = 'zoomI',
	StartZoomOut = 'zoomO',
	StopZoom = 'zoomS',
}

export function zoomActions(instance: PtzOpticsInstance): ActionDefinitions<ZoomActionId> {
	return {
		[ZoomActionId.StartZoomIn]: {
			name: 'Zoom In',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(ZoomIn)
			},
		},
		[ZoomActionId.StartZoomOut]: {
			name: 'Zoom Out',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(ZoomOut)
			},
		},
		[ZoomActionId.StopZoom]: {
			name: 'Zoom Stop',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(ZoomStop)
			},
		},
	}
}
