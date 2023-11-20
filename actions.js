import { SPEED_CHOICES, SHUTTER_CHOICES, PRESET_CHOICES } from './choices.js'
import {
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
	PanTiltHome,
	PresetRecall,
	PresetSave,
	ShutterDown,
	ShutterUp,
	WhiteBalance,
	WhiteBalanceOnePushTrigger,
	ZoomIn,
	ZoomOut,
	ZoomStop,
} from './commands.js'
import {
	CameraPowerOption,
	ExposureModeOption,
	FocusModeOption,
	IrisSetOption,
	PresetRecallOption,
	PresetSaveOption,
	WhiteBalanceOption,
} from './options.js'
import { sendVISCACommand } from './visca/command.js'

function getPtSpeed(instance) {
	var panSpeed = String.fromCharCode(parseInt(instance.ptSpeed, 16) & 0xff)
	var tiltSpeed = String.fromCharCode(Math.min(parseInt(instance.ptSpeed, 16), 0x14) & 0xff)

	return { panSpeed: panSpeed, tiltSpeed: tiltSpeed }
}

export function getActions(instance) {
	const actionDefinitions = {
		left: {
			name: 'Pan Left',
			options: [],
			callback: async (event) => {
				var speeds = getPtSpeed(instance)
				var cmd = '\x81\x01\x06\x01' + speeds.panSpeed + speeds.tiltSpeed + '\x01\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		right: {
			name: 'Pan Right',
			options: [],
			callback: async (event) => {
				var speeds = getPtSpeed(instance)
				var cmd = '\x81\x01\x06\x01' + speeds.panSpeed + speeds.tiltSpeed + '\x02\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		up: {
			name: 'Tilt Up',
			options: [],
			callback: async (event) => {
				var speeds = getPtSpeed(instance)
				var cmd = '\x81\x01\x06\x01' + speeds.panSpeed + speeds.tiltSpeed + '\x03\x01\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		down: {
			name: 'Tilt Down',
			options: [],
			callback: async (event) => {
				var speeds = getPtSpeed(instance)
				var cmd = '\x81\x01\x06\x01' + speeds.panSpeed + speeds.tiltSpeed + '\x03\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		upLeft: {
			name: 'Up Left',
			options: [],
			callback: async (event) => {
				var speeds = getPtSpeed(instance)
				var cmd = '\x81\x01\x06\x01' + speeds.panSpeed + speeds.tiltSpeed + '\x01\x01\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		upRight: {
			name: 'Up Right',
			options: [],
			callback: async (event) => {
				var speeds = getPtSpeed(instance)
				var cmd = '\x81\x01\x06\x01' + speeds.panSpeed + speeds.tiltSpeed + '\x02\x01\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		downLeft: {
			name: 'Down Left',
			options: [],
			callback: async (event) => {
				var speeds = getPtSpeed(instance)
				var cmd = '\x81\x01\x06\x01' + speeds.panSpeed + speeds.tiltSpeed + '\x01\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		downRight: {
			name: 'Down Right',
			options: [],
			callback: async (event) => {
				var speeds = getPtSpeed(instance)
				var cmd = '\x81\x01\x06\x01' + speeds.panSpeed + speeds.tiltSpeed + '\x02\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		stop: {
			name: 'P/T Stop',
			options: [],
			callback: async (event) => {
				var speeds = getPtSpeed(instance)
				var cmd = '\x81\x01\x06\x01' + speeds.panSpeed + speeds.tiltSpeed + '\x03\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
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
				instance.ptSpeed = event.options.speed

				var chosenIndex = -1
				for (var i = 0; i < SPEED_CHOICES.length; ++i) {
					if (SPEED_CHOICES[i].id == instance.ptSpeed) {
						chosenIndex = i
						break
					}
				}
				if (chosenIndex > -1) {
					instance.ptSpeedIndex = chosenIndex
				}
			},
		},
		ptSpeedU: {
			name: 'P/T Speed Up',
			options: [],
			callback: async (event) => {
				if (instance.ptSpeedIndex == 0) {
					instance.ptSpeedIndex = 0
				} else if (instance.ptSpeedIndex > 0) {
					// we decrement the index to speed up, because the SPEED list has the faster settings at the lower indicies
					instance.ptSpeedIndex--
				}
				instance.ptSpeed = SPEED_CHOICES[instance.ptSpeedIndex].id
			},
		},
		ptSpeedD: {
			name: 'P/T Speed Down',
			options: [],
			callback: async (event) => {
				if (instance.ptSpeedIndex == 23) {
					instance.ptSpeedIndex = 23
				} else if (instance.ptSpeedIndex < 23) {
					// we increment the index to slow down, because the SPEED list has the slower settings at the higher indicies
					instance.ptSpeedIndex++
				}
				instance.ptSpeed = SPEED_CHOICES[instance.ptSpeedIndex].id
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
					id: 'val',
					choices: SHUTTER_CHOICES,
				},
			],
			callback: async (event) => {
				var cmd = Buffer.from('\x81\x01\x04\x4A\x00\x00\x00\x00\xFF', 'binary')
				cmd.writeUInt8((parseInt(event.options.val, 16) & 0xf0) >> 4, 6)
				cmd.writeUInt8(parseInt(event.options.val, 16) & 0x0f, 7)
				instance.sendVISCACommand(cmd)
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
					id: 'val',
					choices: PRESET_CHOICES,
					minChoicesForSearch: 1,
				},
				{
					type: 'dropdown',
					label: 'speed setting',
					id: 'speed',
					choices: SPEED_CHOICES,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				var cmd =
					'\x81\x01\x06\x01' +
					String.fromCharCode(parseInt(event.options.val, 16) & 0xff) +
					String.fromCharCode(parseInt(event.options.speed, 16) & 0xff) +
					'\xFF'
				instance.sendVISCACommand(cmd)
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
					id: 'val',
					choices: [
						{ id: 0, label: 'High' },
						{ id: 1, label: 'Normal' },
						{ id: 2, label: 'Low' },
					],
				},
			],
			callback: async (event) => {
				switch (event.options.val) {
					case 0:
						var cmd = '\x81\x01\x04\xA9\x00\xFF'
						break
					case 1:
						var cmd = '\x81\x01\x04\xA9\x01\xFF'
						break
					case 2:
						var cmd = '\x81\x01\x04\xA9\x02\xFF'
						break
				}
				instance.sendVISCACommand(cmd)
			},
		},
		autoTracking: {
			name: 'Auto Tracking',
			options: [
				{
					type: 'dropdown',
					label: 'Auto Tracking (PTZ Optics G3 model required)',
					id: 'tracking',
					choices: [
						{ id: 'off', label: 'Off' },
						{ id: 'on', label: 'On' },
					],
				},
			],
			callback: async (event) => {
				// PTZOptics G3 VISCA over IP Commands, 10/27/2023:
				// 81 0A 11 54 0p FF, p: 0x2=On, 0x3=Off
				const b = event.options.tracking === 'on' ? '\x02' : '\x03'
				const cmd = '\x81\x0A\x11\x54' + b + '\xFF'
				instance.sendVISCACommand(cmd)
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
					var hexData = event.options.custom.replace(/\s+/g, '')
					var tempBuffer = Buffer.from(hexData, 'hex')
					var cmd = tempBuffer.toString('binary')

					if ((tempBuffer[0] & 0xf0) === 0x80) {
						instance.sendVISCACommand(cmd)
					} else {
						instance.log('error', 'Error, command "' + event.options.custom + '" does not start with 8')
					}
				}
			},
		},
	}

	return actionDefinitions
}
