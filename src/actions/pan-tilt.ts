import type {
	CompanionActionContext,
	CompanionActionEvent,
	CompanionOptionValues,
	SomeCompanionActionInputField,
} from '@companion-module/base'
import type { ActionDefinitions } from './actionid.js'
import {
	MoveToAbsolutePanTilt,
	PanTiltAction,
	PanTiltDirection,
	PanTiltHome,
	PanTiltPositionInquiry,
	sendPanTiltCommand,
} from '../camera/pan-tilt.js'
import type { PtzOpticsInstance } from '../instance.js'
import { speedChoices } from './speeds.js'
import { repr } from '../utils/repr.js'

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
	PanLeft = 'left',
	PanRight = 'right',
	TiltUp = 'up',
	TiltDown = 'down',
	MoveUpLeft = 'upLeft',
	MoveUpRight = 'upRight',
	MoveDownLeft = 'downLeft',
	MoveDownRight = 'downRight',
	StopMoving = 'stop',
	ResetToHome = 'home',
	SetMovementSpeed = 'ptSpeedSet',
	SpeedUpMovement = 'ptSpeedU',
	SlowDownMovement = 'ptSpeedD',
	AbsolutePosition = 'moveAbsolutePosition',
}

const PanTiltPosMin = 0x0000
const PanTiltPosMax = 0xffff

type PanOrTilt = 'pan' | 'tilt'

const posIsText = (type: PanOrTilt) => `${type}PosIsText`
const posAsText = (type: PanOrTilt) => `${type}PosAsText`
const posAsNumber = (type: PanOrTilt) => `${type}PosAsNumber`

const speedMinMax = (type: PanOrTilt): [number, number] => (type === 'pan' ? [0x01, 0x18] : [0x01, 0x14])

const speed = (type: PanOrTilt) => `${type}Speed`

function AsNumberIsVisible(options: CompanionOptionValues, type: PanOrTilt): boolean {
	// Don't use `posIsText` because this function can't depend on
	// enclosing-scope names.
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	return !options[`${type}PosIsText`]
}

function AsTextIsVisible(options: CompanionOptionValues, type: PanOrTilt): boolean {
	// Don't use `posIsText` because this function can't depend on
	// enclosing-scope names.
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	return !!options[`${type}PosIsText`]
}

async function getPosition(
	options: CompanionOptionValues,
	type: 'pan' | 'tilt',
	context: CompanionActionContext,
): Promise<number | string> {
	const isText = Boolean(options[`${type}PosIsText`])
	const pos = isText
		? Number(await context.parseVariablesInString(String(options[`${type}PosAsText`])))
		: Number(options[`${type}PosAsNumber`])
	return PanTiltPosMin <= pos && pos <= PanTiltPosMax
		? pos
		: `${type[0].toUpperCase()}${type.slice(1)} position ${pos} not in range ${PanTiltPosMin} through ${PanTiltPosMax}`
}

function getSpeed(options: CompanionOptionValues, type: PanOrTilt): number | string {
	const opt = options[speed(type)]
	const spd = Number(opt)
	const [min, max] = speedMinMax(type)
	if (min <= spd && spd <= max) {
		return spd
	}

	return `Invalid ${type} speed: ${repr(opt)}`
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

	function positionTypeOptions(type: PanOrTilt): SomeCompanionActionInputField[] {
		const uppercased = `${type[0].toUpperCase()}${type.slice(1)}`
		const positionTooltip = `${uppercased} position (${PanTiltPosMin} through ${PanTiltPosMax})`
		return [
			{
				type: 'checkbox',
				id: posIsText(type),
				label: `Specify ${type} position from text`,
				default: false,
			},
			{
				type: 'number',
				id: posAsNumber(type),
				label: `${uppercased} position`,
				tooltip: positionTooltip,
				default: PanTiltPosMin,
				min: PanTiltPosMin,
				max: PanTiltPosMax,
				isVisible: AsNumberIsVisible,
				isVisibleData: type,
			},
			{
				type: 'textinput',
				id: posAsText(type),
				label: `${uppercased} position`,
				tooltip: positionTooltip,
				useVariables: { local: true },
				default: `${PanTiltPosMin}`,
				isVisible: AsTextIsVisible,
				isVisibleData: type,
			},
		]
	}

	return {
		[PanTiltActionId.AbsolutePosition]: {
			name: 'Move to Absolute Position',
			options: [
				...positionTypeOptions('pan'),
				...positionTypeOptions('tilt'),
				{
					type: 'dropdown',
					label: 'Pan speed',
					id: speed('pan'),
					choices: speedChoices(...speedMinMax('pan')),
					tooltip: 'Pan speed',
					default: 12,
				},
				{
					type: 'dropdown',
					label: 'Tilt speed',
					id: speed('tilt'),
					choices: speedChoices(...speedMinMax('tilt')),
					tooltip: 'Tilt speed',
					default: 12,
				},
			],
			callback: async ({ options }, context) => {
				const panPosition = await getPosition(options, 'pan', context)
				if (typeof panPosition === 'string') {
					instance.log('error', `Pan/tilt to absolute: ${panPosition}`)
					return
				}

				const tiltPosition = await getPosition(options, 'tilt', context)
				if (typeof tiltPosition === 'string') {
					instance.log('error', `Pan/tilt to absolute: ${tiltPosition}`)
					return
				}

				const panSpeed = getSpeed(options, 'pan')
				if (typeof panSpeed !== 'number') {
					instance.log('error', `Pan/tilt to absolute: ${panSpeed}`)
					return
				}

				const tiltSpeed = getSpeed(options, 'tilt')
				if (typeof tiltSpeed !== 'number') {
					instance.log('error', `Pan/tilt to absolute: ${tiltSpeed}`)
					return
				}

				instance.sendCommand(MoveToAbsolutePanTilt, {
					panPosition,
					tiltPosition,
					panSpeed,
					tiltSpeed,
				})
			},
			learn: async ({ options }, _context) => {
				const answer = await instance.sendInquiry(PanTiltPositionInquiry)
				if (answer === null) {
					return undefined
				}

				const learnedOpts: CompanionOptionValues = {}

				const panPosIsText = Boolean(options[posIsText('pan')])
				if (panPosIsText) {
					learnedOpts[posAsText('pan')] = String(answer.panPosition)
				} else {
					learnedOpts[posAsNumber('pan')] = answer.panPosition
				}

				const tiltPosIsText = Boolean(options[posIsText('tilt')])
				if (tiltPosIsText) {
					learnedOpts[posAsText('tilt')] = String(answer.tiltPosition)
				} else {
					learnedOpts[posAsNumber('tilt')] = answer.tiltPosition
				}

				return {
					...options,
					...learnedOpts,
				}
			},
		},
		[PanTiltActionId.PanLeft]: {
			name: 'Pan Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Left]),
		},
		[PanTiltActionId.PanRight]: {
			name: 'Pan Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Right]),
		},
		[PanTiltActionId.TiltUp]: {
			name: 'Tilt Up',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Up]),
		},
		[PanTiltActionId.TiltDown]: {
			name: 'Tilt Down',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Down]),
		},
		[PanTiltActionId.MoveUpLeft]: {
			name: 'Up Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.UpLeft]),
		},
		[PanTiltActionId.MoveUpRight]: {
			name: 'Up Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.UpRight]),
		},
		[PanTiltActionId.MoveDownLeft]: {
			name: 'Down Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.DownLeft]),
		},
		[PanTiltActionId.MoveDownRight]: {
			name: 'Down Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.DownRight]),
		},
		[PanTiltActionId.StopMoving]: {
			name: 'P/T Stop',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Stop]),
		},
		[PanTiltActionId.ResetToHome]: {
			name: 'P/T Home',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(PanTiltHome)
			},
		},
		[PanTiltActionId.SetMovementSpeed]: {
			name: 'P/T Speed',
			options: [
				{
					type: 'dropdown',
					label: 'Speed setting',
					id: PanTiltSpeedSetSpeedId,
					choices: speedChoices(1, 24),
					default: 12,
				},
			],
			callback: async ({ options }) => {
				const speed = Number(options[PanTiltSpeedSetSpeedId])
				instance.setPanTiltSpeed(speed)
			},
		},
		[PanTiltActionId.SpeedUpMovement]: {
			name: 'P/T Speed Up',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.increasePanTiltSpeed()
			},
		},
		[PanTiltActionId.SlowDownMovement]: {
			name: 'P/T Speed Down',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.decreasePanTiltSpeed()
			},
		},
	}
}
