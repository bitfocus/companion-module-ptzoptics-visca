import type { CompanionActionEvent } from '@companion-module/base'
import type { ActionDefinitions } from './actionid.js'
import {
	OnScreenDisplayBack,
	OnScreenDisplayClose,
	OnScreenDisplayEnter,
	OnScreenDisplayNavigate,
	OnScreenDisplayToggle,
} from '../camera/commands.js'
import { OnScreenDisplayInquiry } from '../camera/inquiries.js'
import { OnScreenDisplayNavigateOption, OnScreenDisplayOption } from '../camera/options.js'
import type { PtzOpticsInstance } from '../instance.js'

export enum OSDActionId {
	OSD = 'onScreenDisplay',
	OSDNavigate = 'onScreenDisplayNavigate',
	OSDEnter = 'onScreenDisplayEnter',
	OSDBack = 'onScreenDisplayBack',
}

export function osdActions(instance: PtzOpticsInstance): ActionDefinitions<OSDActionId> {
	return {
		[OSDActionId.OSD]: {
			name: 'OSD Open/Close',
			options: [
				{
					type: 'dropdown',
					label: 'Activate OSD menu',
					id: OnScreenDisplayOption.id,
					choices: [...OnScreenDisplayOption.choices, { id: 'toggle', label: 'Toggle' }],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => {
				let shouldToggle = false
				switch (options[OnScreenDisplayOption.id]) {
					case 'close':
						instance.sendCommand(OnScreenDisplayClose)
						return
					case 'toggle':
						shouldToggle = true
						break
					case 'open': {
						const opts = await instance.sendInquiry(OnScreenDisplayInquiry)
						if (opts === null) return
						shouldToggle = opts[OnScreenDisplayOption.id] !== 'open'
					}
				}

				if (shouldToggle) {
					instance.sendCommand(OnScreenDisplayToggle)
				}
			},
			learn: async (_event: CompanionActionEvent) => {
				const opts = await instance.sendInquiry(OnScreenDisplayInquiry)
				if (opts === null) return undefined
				return { ...opts }
			},
		},
		[OSDActionId.OSDNavigate]: {
			name: 'Navigate OSD Camera menu',
			options: [
				{
					type: 'dropdown',
					label: 'Direction',
					id: OnScreenDisplayNavigateOption.id,
					choices: OnScreenDisplayNavigateOption.choices,
					default: 'down',
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(OnScreenDisplayNavigate, event.options)
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
