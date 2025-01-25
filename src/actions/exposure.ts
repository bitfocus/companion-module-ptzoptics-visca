import type { CompanionActionEvent, CompanionOptionValues } from '@companion-module/base'
import type { ActionDefinitions } from './actionid.js'
import {
	ExposureMode,
	ExposureModeInquiry,
	IrisDown,
	IrisSet,
	type IrisSetting,
	IrisUp,
	ShutterDown,
	ShutterSet,
	type ShutterSetting,
	ShutterUp,
} from '../camera/exposure.js'
import type { PtzOpticsInstance } from '../instance.js'
import { optionConversions } from './option-conversion.js'
import { twoDigitHex } from '../utils/two-digit-hex.js'

export enum ExposureActionId {
	SelectExposureMode = 'expM',
	IrisUp = 'irisU',
	IrisDown = 'irisD',
	SetIris = 'irisS',
	ShutterUp = 'shutU',
	ShutterDown = 'shutD',
	SetShutter = 'shutS',
}

export const ExposureModeId = 'val'

const [getExposureMode, exposureModeToOption] = optionConversions<ExposureMode, typeof ExposureModeId>(
	ExposureModeId,
	[
		['0', 'full-auto'],
		['1', 'manual'],
		['2', 'shutter-priority'],
		['3', 'iris-priority'],
		['4', 'bright-mode-manual'],
	],
	'full-auto',
	'0',
	String,
)

export const IrisSettingId = 'val'

const [getIrisSetting] = optionConversions<IrisSetting, typeof IrisSettingId>(
	IrisSettingId,
	[
		['11', 'F1.8'],
		['10', 'F2.0'],
		['0F', 'F2.4'],
		['0E', 'F2.8'],
		['0D', 'F3.4'],
		['0C', 'F4.0'],
		['0B', 'F4.8'],
		['0A', 'F5.6'],
		['09', 'F6.8'],
		['08', 'F8.0'],
		['07', 'F9.6'],
		['06', 'F11.0'],
		['00', 'CLOSED'],
	],
	'CLOSED',
	'00',
	String,
)

export const ShutterSettingId = 'val'

const DefaultShutterSetting = 4

// XXX These mappings aren't all correct on G3, 1/180 seems really to be 1/200
//     and 1/90-30 seems really to be 1/60-50-30.
function getShutterSetting(options: CompanionOptionValues): ShutterSetting {
	let setting = parseInt(String(options[ShutterSettingId]), 16)
	if (setting < 0x01) {
		setting = 0x01
	} else if (0x11 < setting) {
		setting = 0x11
	}

	switch (setting) {
		case 0x11:
			return '1/1000000'
		case 0x10:
			return '1/6000'
		case 0x0f:
			return '1/4000'
		case 0x0e:
			return '1/3000'
		case 0x0d:
			return '1/2000'
		case 0x0c:
			return '1/1500'
		case 0x0b:
			return '1/1000'
		case 0x0a:
			return '1/725'
		case 0x09:
			return '1/500'
		case 0x08:
			return '1/350'
		case 0x07:
			return '1/250'
		case 0x06:
			return '1/180'
		case 0x05:
			return '1/125'
		default:
		case 0x04:
			return '1/100'
		case 0x03:
			return '1/90'
		case 0x02:
			return '1/60'
		case 0x01:
			return '1/30'
	}
}

export function exposureActions(instance: PtzOpticsInstance): ActionDefinitions<ExposureActionId> {
	return {
		[ExposureActionId.SelectExposureMode]: {
			name: 'Exposure Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Mode setting',
					id: ExposureModeId,
					choices: [
						{ id: '0', label: 'Full Auto' },
						{ id: '1', label: 'Manual' },
						{ id: '2', label: 'Shutter Pri' },
						{ id: '3', label: 'Iris Pri' },
						{ id: '4', label: 'Bright Mode (manual)' }, // Not in latest API doc: remove?
					],
					default: '0',
				},
			],
			callback: async ({ options }) => {
				const mode = getExposureMode(options)
				instance.sendCommand(ExposureMode, { mode })
			},
			learn: async (_event: CompanionActionEvent) => {
				const opts = await instance.sendInquiry(ExposureModeInquiry)
				if (opts === null) {
					return undefined
				}
				return { [ExposureModeId]: exposureModeToOption(opts.mode) }
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
					id: IrisSettingId,
					choices: [
						{ id: '11', label: 'F1.8' },
						{ id: '10', label: 'F2.0' },
						{ id: '0F', label: 'F2.4' },
						{ id: '0E', label: 'F2.8' },
						{ id: '0D', label: 'F3.4' },
						{ id: '0C', label: 'F4.0' },
						{ id: '0B', label: 'F4.8' },
						{ id: '0A', label: 'F5.6' },
						{ id: '09', label: 'F6.8' },
						{ id: '08', label: 'F8.0' },
						{ id: '07', label: 'F9.6' },
						{ id: '06', label: 'F11.0' },
						{ id: '00', label: 'CLOSED' },
					],
					default: '0C',
				},
			],
			callback: async ({ options }) => {
				const setting = getIrisSetting(options)
				instance.sendCommand(IrisSet, { setting })
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
					id: ShutterSettingId,
					choices: [
						{ id: '11', label: '1/1000000' },
						{ id: '10', label: '1/6000' },
						{ id: '0F', label: '1/4000' },
						{ id: '0E', label: '1/3000' },
						{ id: '0D', label: '1/2000' },
						{ id: '0C', label: '1/1500' },
						{ id: '0B', label: '1/1000' },
						{ id: '0A', label: '1/725' },
						{ id: '09', label: '1/500' },
						{ id: '08', label: '1/350' },
						{ id: '07', label: '1/250' },
						{ id: '06', label: '1/180' },
						{ id: '05', label: '1/125' },
						{ id: '04', label: '1/100' },
						{ id: '03', label: '1/90' },
						{ id: '02', label: '1/60' },
						{ id: '01', label: '1/30' },
					],
					default: twoDigitHex(DefaultShutterSetting),
				},
			],
			callback: async ({ options }) => {
				const setting = getShutterSetting(options)
				instance.sendCommand(ShutterSet, { setting })
			},
		},
	}
}
