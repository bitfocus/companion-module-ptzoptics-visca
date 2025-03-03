import type { CompanionActionEvent } from '@companion-module/base'
import type { ActionDefinitions } from './actionid.js'
import { PanTiltAction, PanTiltDirection, PanTiltHome, sendPanTiltCommand } from '../camera/pan-tilt.js'
import { SPEED_CHOICES } from './speeds.js'
import type { PtzOpticsInstance } from '../instance.js'

/**
 * The id of the obsolete action to set module-global pan/tilt speed using
 * options storing the preset and speed as two-digit hex number strings.
 *
 * This action has been replaced by the action below that defines those options
 * to both accept simple numbers instead.  The upgrade from obsolete to new
 * action is performed in `tryUpdatePresetAndSpeedEncodingsInActions` because of
 * the shared preset-number and speed choice encodings used across actions that
 * span two action subsets.
 */
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
	PanTiltSpeedSet = 'ptSpeedSet',
	PanTiltSpeedUp = 'ptSpeedU',
	PanTiltSpeedDown = 'ptSpeedD',
}

/**
 * The id of the option on the set-global-pan/tilt-speed action that specifies
 * the speed.
 */
export const PanTiltSpeedSetSpeedId = 'speed'

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
		[PanTiltActionId.PanTiltSpeedSet]: {
			name: 'P/T Speed',
			options: [
				{
					type: 'dropdown',
					label: 'Speed setting',
					id: PanTiltSpeedSetSpeedId,
					choices: SPEED_CHOICES,
					default: 12,
				},
			],
			callback: async ({ options }) => {
				const speed = Number(options[PanTiltSpeedSetSpeedId])
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
