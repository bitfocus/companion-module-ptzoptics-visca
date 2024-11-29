import type { CompanionActionDefinition, CompanionActionEvent } from '@companion-module/base'
import { ExposureMode, IrisDown, IrisSet, IrisUp, ShutterDown, ShutterSet, ShutterUp } from '../camera/commands.js'
import { ExposureModeInquiry } from '../camera/inquiries.js'
import { ExposureModeOption, IrisSetOption, ShutterSetOption } from '../camera/options.js'
import type { PtzOpticsInstance } from '../instance.js'

export enum ExposureActionId {
	SelectExposureMode = 'expM',
	IrisUp = 'irisU',
	IrisDown = 'irisD',
	SetIris = 'irisS',
	ShutterUp = 'shutU',
	ShutterDown = 'shutD',
	SetShutter = 'shutS',
}

export function exposureActions(instance: PtzOpticsInstance): Record<ExposureActionId, CompanionActionDefinition> {
	return {
		[ExposureActionId.SelectExposureMode]: {
			name: 'Exposure Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Mode setting',
					id: ExposureModeOption.id,
					choices: ExposureModeOption.choices,
					default: ExposureModeOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(ExposureMode, event.options)
			},
			learn: async (_event: CompanionActionEvent) => {
				const opts = await instance.sendInquiry(ExposureModeInquiry)
				if (opts === null) return undefined
				return { ...opts }
			},
		},
		[ExposureActionId.IrisUp]: {
			name: 'Iris Up',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(IrisUp)
			},
		},
		[ExposureActionId.IrisDown]: {
			name: 'Iris Down',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(IrisDown)
			},
		},
		[ExposureActionId.SetIris]: {
			name: 'Set Iris',
			options: [
				{
					type: 'dropdown',
					label: 'Iris setting',
					id: IrisSetOption.id,
					choices: IrisSetOption.choices,
					default: IrisSetOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(IrisSet, event.options)
			},
		},
		[ExposureActionId.ShutterUp]: {
			name: 'Shutter Up',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(ShutterUp)
			},
		},
		[ExposureActionId.ShutterDown]: {
			name: 'Shutter Down',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(ShutterDown)
			},
		},
		[ExposureActionId.SetShutter]: {
			name: 'Set Shutter',
			options: [
				{
					type: 'dropdown',
					label: 'Shutter setting',
					id: ShutterSetOption.id,
					choices: ShutterSetOption.choices,
					default: ShutterSetOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(ShutterSet, event.options)
			},
		},
	}
}
