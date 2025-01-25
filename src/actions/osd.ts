import { type CompanionActionEvent } from '@companion-module/base'
import type { ActionDefinitions } from './actionid.js'
import {
	OnScreenDisplayBack,
	OnScreenDisplayClose,
	OnScreenDisplayEnter,
	type OnScreenDisplayMenuState,
	OnScreenDisplayNavigate,
	OnScreenDisplayToggle,
	type OSDNavigateDirection,
} from '../camera/osd.js'
import { OnScreenDisplayInquiry } from '../camera/osd.js'
import type { PtzOpticsInstance } from '../instance.js'
import { optionNullConversions } from './option-conversion.js'

export enum OSDActionId {
	OSD = 'onScreenDisplay',
	OSDNavigate = 'onScreenDisplayNavigate',
	OSDEnter = 'onScreenDisplayEnter',
	OSDBack = 'onScreenDisplayBack',
}

export const OnScreenDisplayMenuStateId = 'state'

const osdMenuStateToOption = optionNullConversions<OnScreenDisplayMenuState, typeof OnScreenDisplayMenuStateId>(
	OnScreenDisplayMenuStateId,
	['open', 'close'],
	'open',
)[1]

export const OSDNavigateDirectionId = 'direction'

const [getOSDNavigateDirection] = optionNullConversions<OSDNavigateDirection, typeof OSDNavigateDirectionId>(
	OSDNavigateDirectionId,
	['up', 'down', 'left', 'right'],
	'down',
)

export function osdActions(instance: PtzOpticsInstance): ActionDefinitions<OSDActionId> {
	return {
		[OSDActionId.OSD]: {
			name: 'OSD Open/Close',
			options: [
				{
					type: 'dropdown',
					label: 'Activate OSD menu',
					id: OnScreenDisplayMenuStateId,
					choices: [
						{ id: 'open', label: 'Open' },
						{ id: 'close', label: 'Close' },
						{ id: 'toggle', label: 'Toggle' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => {
				let shouldToggle = false
				switch (options[OnScreenDisplayMenuStateId]) {
					case 'close':
						instance.sendCommand(OnScreenDisplayClose)
						return
					case 'toggle':
						shouldToggle = true
						break
					case 'open': {
						const answer = await instance.sendInquiry(OnScreenDisplayInquiry)
						if (answer === null) {
							instance.log('error', 'OSD menu state inquiry failed')
							return
						}
						shouldToggle = answer.state !== 'open'
					}
				}

				if (shouldToggle) {
					instance.sendCommand(OnScreenDisplayToggle)
				}
			},
			learn: async (_event: CompanionActionEvent) => {
				const answer = await instance.sendInquiry(OnScreenDisplayInquiry)
				if (answer === null) {
					return undefined
				}
				return { [OnScreenDisplayMenuStateId]: osdMenuStateToOption(answer.state) }
			},
		},
		[OSDActionId.OSDNavigate]: {
			name: 'Navigate OSD Camera menu',
			options: [
				{
					type: 'dropdown',
					label: 'Direction',
					id: OSDNavigateDirectionId,
					choices: [
						{ id: 'up', label: 'Up' },
						{ id: 'right', label: 'Right' },
						{ id: 'down', label: 'Down' },
						{ id: 'left', label: 'Left' },
					],
					default: 'down',
				},
			],
			callback: async ({ options }) => {
				const direction = getOSDNavigateDirection(options)
				instance.sendCommand(OnScreenDisplayNavigate, { direction })
			},
		},
		[OSDActionId.OSDEnter]: {
			name: 'OSD Enter',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(OnScreenDisplayEnter)
			},
		},
		[OSDActionId.OSDBack]: {
			name: 'OSD Back',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(OnScreenDisplayBack)
			},
		},
	}
}
