import type { CompanionActionDefinition, CompanionActionEvent } from '@companion-module/base'
import { ZoomIn, ZoomOut, ZoomStop } from '../camera/commands.js'
import type { PtzOpticsInstance } from '../instance.js'

export enum ZoomActionId {
	StartZoomIn = 'zoomI',
	StartZoomOut = 'zoomO',
	StopZoom = 'zoomS',
}

export function zoomActions(instance: PtzOpticsInstance): Record<ZoomActionId, CompanionActionDefinition> {
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
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(ZoomOut, event.options)
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
