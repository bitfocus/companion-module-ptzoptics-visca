import type { CompanionActionEvent } from '@companion-module/base'
import { type ActionDefinitions, type OtherActionId, OtherActionId as PtzOpticsActionId } from './actionid.js'
import {
	AutoTracking,
	CameraPower,
	ExposureMode,
	IrisDown,
	IrisSet,
	IrisUp,
	ShutterDown,
	ShutterSet,
	ShutterUp,
} from '../camera/commands.js'
import { ExposureModeInquiry } from '../camera/inquiries.js'
import {
	AutoTrackingOption,
	CameraPowerOption,
	ExposureModeOption,
	IrisSetOption,
	ShutterSetOption,
} from '../camera/options.js'
import type { PtzOpticsInstance } from '../instance.js'

export function otherActions(instance: PtzOpticsInstance): ActionDefinitions<OtherActionId> {
	return {
		[PtzOpticsActionId.SelectExposureMode]: {
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
		[PtzOpticsActionId.IrisUp]: {
			name: 'Iris Up',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(IrisUp)
			},
		},
		[PtzOpticsActionId.IrisDown]: {
			name: 'Iris Down',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(IrisDown)
			},
		},
		[PtzOpticsActionId.SetIris]: {
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
		[PtzOpticsActionId.ShutterUp]: {
			name: 'Shutter Up',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(ShutterUp)
			},
		},
		[PtzOpticsActionId.ShutterDown]: {
			name: 'Shutter Down',
			options: [],
			callback: async (_event: CompanionActionEvent) => {
				instance.sendCommand(ShutterDown)
			},
		},
		[PtzOpticsActionId.SetShutter]: {
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
		[PtzOpticsActionId.CameraPowerState]: {
			name: 'Power Camera',
			options: [
				{
					type: 'dropdown',
					label: 'Power on/standby',
					id: CameraPowerOption.id,
					choices: CameraPowerOption.choices,
					default: CameraPowerOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(CameraPower, event.options)
			},
		},
		[PtzOpticsActionId.AutoTracking]: {
			name: 'Auto Tracking',
			options: [
				{
					type: 'dropdown',
					label: 'Auto tracking (PTZ Optics G3 model required)',
					id: AutoTrackingOption.id,
					choices: AutoTrackingOption.choices,
					default: AutoTrackingOption.default,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				instance.sendCommand(AutoTracking, event.options)
			},
		},
	}
}
