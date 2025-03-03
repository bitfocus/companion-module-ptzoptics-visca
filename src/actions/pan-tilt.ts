import type { CompanionActionEvent } from '@companion-module/base'
import type { ActionDefinitions } from './actionid.js'
import { PanTiltAction, PanTiltDirection, PanTiltHome, sendPanTiltCommand } from '../camera/pan-tilt.js'
import { SPEED_CHOICES } from './speeds.js'
import type { PtzOpticsInstance } from '../instance.js'

export const ObsoletePtSpeedSId = 'ptSpeedS'

export enum PanTiltActionId {
	PanTiltLeft = 'left',
	PanTiltRight = 'right',
	PanTiltUp = 'up',
	PanTiltDown = 'down',
	PanTiltUpLeft = 'upLeft',
	PanTiltUpRight = 'upRight',
	PanTiltDownLeft = 'downLeft',
	PanTiltDownRight = 'downRight',
	PanTiltStop = 'stop',
	PanTiltHome = 'home',
	PanTiltSetSpeed = ObsoletePtSpeedSId,
	PanTiltSpeedUp = 'ptSpeedU',
	PanTiltSpeedDown = 'ptSpeedD',
}

const PanTiltSpeedOptionId = 'speed'

export function panTiltActions(instance: PtzOpticsInstance): ActionDefinitions<PanTiltActionId> {
	function createPanTiltCallback(direction: readonly [number, number]) {
		return async (_event: CompanionActionEvent) => {
			const { panSpeed, tiltSpeed } = instance.panTiltSpeed()
			sendPanTiltCommand(instance, direction, panSpeed, tiltSpeed)
		}
	}

	return {
		[PanTiltActionId.PanTiltLeft]: {
			name: 'Pan Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Left]),
		},
		[PanTiltActionId.PanTiltRight]: {
			name: 'Pan Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Right]),
		},
		[PanTiltActionId.PanTiltUp]: {
			name: 'Tilt Up',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Up]),
		},
		[PanTiltActionId.PanTiltDown]: {
			name: 'Tilt Down',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Down]),
		},
		[PanTiltActionId.PanTiltUpLeft]: {
			name: 'Up Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.UpLeft]),
		},
		[PanTiltActionId.PanTiltUpRight]: {
			name: 'Up Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.UpRight]),
		},
		[PanTiltActionId.PanTiltDownLeft]: {
			name: 'Down Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.DownLeft]),
		},
		[PanTiltActionId.PanTiltDownRight]: {
			name: 'Down Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.DownRight]),
		},
		[PanTiltActionId.PanTiltStop]: {
			name: 'P/T Stop',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Stop]),
		},
		[PanTiltActionId.PanTiltHome]: {
			name: 'P/T Home',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(PanTiltHome)
			},
		},
		[PanTiltActionId.PanTiltSetSpeed]: {
			name: 'P/T Speed',
			options: [
				{
					type: 'dropdown',
					label: 'Speed setting',
					id: PanTiltSpeedOptionId,
					choices: SPEED_CHOICES,
					default: '0C',
				},
			],
			callback: async ({ options }) => {
				const speed = parseInt(String(options[PanTiltSpeedOptionId]), 16)
				instance.setPanTiltSpeed(speed)
			},
		},
		[PanTiltActionId.PanTiltSpeedUp]: {
			name: 'P/T Speed Up',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.increasePanTiltSpeed()
			},
		},
		[PanTiltActionId.PanTiltSpeedDown]: {
			name: 'P/T Speed Down',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.decreasePanTiltSpeed()
			},
		},
	}
}
