import type { CompanionActionDefinition, CompanionActionEvent } from '@companion-module/base'
import {
	FocusFarStandard,
	FocusLock,
	FocusMode,
	FocusNearStandard,
	FocusStop,
	FocusUnlock,
} from '../camera/commands.js'
import { FocusModeInquiry } from '../camera/inquiries.js'
import { FocusModeOption } from '../camera/options.js'
import type { PtzOpticsInstance } from '../instance.js'

export enum FocusActionId {
	SelectFocusMode = 'focusM',
	StartFocusNearer = 'focusN',
	StartFocusFarther = 'focusF',
	StopFocus = 'focusS',
	LockFocus = 'focusL',
	UnlockFocus = 'focusU',
}

export function focusActions(instance: PtzOpticsInstance): Record<FocusActionId, CompanionActionDefinition> {
	return {
		[FocusActionId.SelectFocusMode]: {
			name: 'Focus Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Auto/manual focus',
					id: FocusModeOption.id,
					choices: FocusModeOption.choices,
					default: FocusModeOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(FocusMode, event.options)
			},
			learn: async (_event: CompanionActionEvent) => {
				const opts = await instance.sendInquiry(FocusModeInquiry)
				if (opts === null) return undefined
				return { ...opts }
			},
		},
		[FocusActionId.StartFocusNearer]: {
			name: 'Focus Near',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(FocusNearStandard)
			},
		},
		[FocusActionId.StartFocusFarther]: {
			name: 'Focus Far',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(FocusFarStandard)
			},
		},
		[FocusActionId.StopFocus]: {
			name: 'Focus Stop',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(FocusStop)
			},
		},
		[FocusActionId.LockFocus]: {
			name: 'Focus Lock',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(FocusLock)
			},
		},
		[FocusActionId.UnlockFocus]: {
			name: 'Focus Unlock',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(FocusUnlock)
			},
		},
	}
}
