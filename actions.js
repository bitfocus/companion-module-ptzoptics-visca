import {
	AutoTracking,
	AutoWhiteBalanceSensitivity,
	CameraPower,
	ExposureMode,
	FocusFarStandard,
	FocusLock,
	FocusMode,
	FocusNearStandard,
	FocusStop,
	FocusUnlock,
	IrisDown,
	IrisSet,
	IrisUp,
	PanTiltDirection,
	PanTiltHome,
	PresetDriveSpeed,
	PresetRecall,
	PresetSave,
	ShutterDown,
	ShutterSet,
	ShutterUp,
	WhiteBalance,
	WhiteBalanceOnePushTrigger,
	ZoomIn,
	ZoomOut,
	ZoomStop,
	sendPanTiltCommand,
} from './commands.js'
import {
	AutoTrackingOption,
	AutoWhiteBalanceSensitivityOption,
	CameraPowerOption,
	ExposureModeOption,
	FocusModeOption,
	IrisSetOption,
	PresetDriveNumberOption,
	PresetDriveSpeedOption,
	PresetRecallOption,
	PresetSaveOption,
	ShutterSetOption,
	SPEED_CHOICES,
	WhiteBalanceOption,
} from './options.js'
import { UserDefinedCommand, sendVISCACommand } from './visca/command.js'

export function getActions(instance) {
	function createPanTiltCallback(direction) {
		return async (event) => {
			const { panSpeed, tiltSpeed } = instance.panTiltSpeed()
			sendPanTiltCommand(instance, direction, panSpeed, tiltSpeed)
		}
	}

	const actionDefinitions = {
		left: {
			name: 'Pan Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.Left),
		},
		right: {
			name: 'Pan Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.Right),
		},
		up: {
			name: 'Tilt Up',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.Up),
		},
		down: {
			name: 'Tilt Down',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.Down),
		},
		upLeft: {
			name: 'Up Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.UpLeft),
		},
		upRight: {
			name: 'Up Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.UpRight),
		},
		downLeft: {
			name: 'Down Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.DownLeft),
		},
		downRight: {
			name: 'Down Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.DownRight),
		},
		stop: {
			name: 'P/T Stop',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.Stop),
		},
		home: {
			name: 'P/T Home',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, PanTiltHome)
			},
		},
		ptSpeedS: {
			name: 'P/T Speed',
			options: [
				{
					type: 'dropdown',
					label: 'speed setting',
					id: 'speed',
					choices: SPEED_CHOICES,
				},
			],
			callback: async (event) => {
				const speed = parseInt(event.options.speed, 16)
				instance.setPanTiltSpeed(speed)
			},
		},
		ptSpeedU: {
			name: 'P/T Speed Up',
			options: [],
			callback: async (event) => {
				instance.increasePanTiltSpeed()
			},
		},
		ptSpeedD: {
			name: 'P/T Speed Down',
			options: [],
			callback: async (event) => {
				instance.decreasePanTiltSpeed()
			},
		},
		zoomI: {
			name: 'Zoom In',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, ZoomIn)
			},
		},
		zoomO: {
			name: 'Zoom Out',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, ZoomOut)
			},
		},
		zoomS: {
			name: 'Zoom Stop',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, ZoomStop)
			},
		},
		focusN: {
			name: 'Focus Near',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, FocusNearStandard)
			},
		},
		focusF: {
			name: 'Focus Far',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, FocusFarStandard)
			},
		},
		focusS: {
			name: 'Focus Stop',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, FocusStop)
			},
		},
		focusM: {
			name: 'Focus Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Auto / Manual Focus',
					id: FocusModeOption.id,
					choices: FocusModeOption.choices,
				},
			],
			callback: async (event) => {
				sendVISCACommand(instance, FocusMode, event.options)
			},
		},
		focusL: {
			name: 'Focus Lock',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, FocusLock)
			},
		},
		focusU: {
			name: 'Focus Unlock',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, FocusUnlock)
			},
		},
		expM: {
			name: 'Exposure Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Mode setting',
					id: ExposureModeOption.id,
					choices: ExposureModeOption.choices,
				},
			],
			callback: async (event) => {
				sendVISCACommand(instance, ExposureMode, event.options)
			},
		},
		irisU: {
			name: 'Iris Up',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, IrisUp)
			},
		},
		irisD: {
			name: 'Iris Down',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, IrisDown)
			},
		},
		irisS: {
			name: 'Set Iris',
			options: [
				{
					type: 'dropdown',
					label: 'Iris setting',
					id: IrisSetOption.id,
					choices: IrisSetOption.choices,
				},
			],
			callback: async (event) => {
				sendVISCACommand(instance, IrisSet, event.options)
			},
		},
		shutU: {
			name: 'Shutter Up',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, ShutterUp)
			},
		},
		shutD: {
			name: 'Shutter Down',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, ShutterDown)
			},
		},
		shutS: {
			name: 'Set Shutter',
			options: [
				{
					type: 'dropdown',
					label: 'Shutter setting',
					id: ShutterSetOption.id,
					choices: ShutterSetOption.choices,
				},
			],
			callback: async (event) => {
				sendVISCACommand(instance, ShutterSet, event.options)
			},
		},
		savePset: {
			name: 'Save Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: PresetSaveOption.id,
					choices: PresetSaveOption.choices,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				sendVISCACommand(instance, PresetSave, event.options)
			},
		},
		recallPset: {
			name: 'Recall Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: PresetRecallOption.id,
					choices: PresetRecallOption.choices,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				sendVISCACommand(instance, PresetRecall, event.options)
			},
		},
		speedPset: {
			name: 'Preset Drive Speed',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: PresetDriveNumberOption.id,
					choices: PresetDriveNumberOption.choices,
					minChoicesForSearch: 1,
				},
				{
					type: 'dropdown',
					label: 'speed setting',
					id: PresetDriveSpeedOption.id,
					choices: PresetDriveSpeedOption.choices,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				sendVISCACommand(instance, PresetDriveSpeed, event.options)
			},
		},
		power: {
			name: 'Power Camera',
			options: [
				{
					type: 'dropdown',
					label: 'power on/off',
					id: CameraPowerOption.id,
					choices: CameraPowerOption.choices,
				},
			],
			callback: async (event) => {
				sendVISCACommand(instance, CameraPower, event.options)
			},
		},
		wb: {
			name: 'White balance',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: WhiteBalanceOption.id,
					choices: WhiteBalanceOption.choices,
				},
			],
			callback: async (event) => {
				sendVISCACommand(instance, WhiteBalance, event.options)
			},
		},
		wbOPT: {
			name: 'White balance one push trigger',
			options: [],
			callback: async (event) => {
				sendVISCACommand(instance, WhiteBalanceOnePushTrigger)
			},
		},
		awbS: {
			name: 'Auto white balance sensitivity',
			options: [
				{
					type: 'dropdown',
					label: 'Sensitivity',
					id: AutoWhiteBalanceSensitivityOption.id,
					choices: AutoWhiteBalanceSensitivityOption.choices,
				},
			],
			callback: async (event) => {
				sendVISCACommand(instance, AutoWhiteBalanceSensitivity, event.options)
			},
		},
		autoTracking: {
			name: 'Auto Tracking',
			options: [
				{
					type: 'dropdown',
					label: 'Auto Tracking (PTZ Optics G3 model required)',
					id: AutoTrackingOption.id,
					choices: AutoTrackingOption.choices,
				},
			],
			callback: async (event) => {
				sendVISCACommand(instance, AutoTracking, event.options)
			},
		},
		custom: {
			name: 'Custom command',
			options: [
				{
					type: 'textinput',
					label: 'Please refer to PTZOptics VISCA over IP command document for valid commands.',
					id: 'custom',
					regex: '/^81 ?([0-9a-fA-F]{2} ?){3,13}[fF][fF]$/',
					width: 6,
				},
			],
			callback: async (event) => {
				if (typeof event.options.custom === 'string' || event.options.custom instanceof String) {
					const hexData = event.options.custom.replace(/\s+/g, '')
					const bytes = []
					for (let i = 0; i < hexData.length; i += 2) {
						bytes.push(parseInt(hexData.substr(i, 2), 16))
					}

					const command = new UserDefinedCommand(bytes)
					sendVISCACommand(instance, command)
				}
			},
		},
	}

	return actionDefinitions
}
