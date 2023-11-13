import { SPEED_CHOICES, IRIS_CHOICES, SHUTTER_CHOICES, PRESET_CHOICES } from './choices.js'

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
				var cmd = '\x81\x01\x06\x04\xFF'
				instance.sendVISCACommand(cmd)
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
				var cmd = '\x81\x01\x04\x07\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		zoomO: {
			name: 'Zoom Out',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x07\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		zoomS: {
			name: 'Zoom Stop',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x07\x00\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		focusN: {
			name: 'Focus Near',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x08\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		focusF: {
			name: 'Focus Far',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x08\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		focusS: {
			name: 'Focus Stop',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x08\x00\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		focusM: {
			name: 'Focus Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Auto / Manual Focus',
					id: 'bol',
					choices: [
						{ id: '0', label: 'Auto Focus' },
						{ id: '1', label: 'Manual Focus' },
					],
				},
			],
			callback: async (event) => {
				if (event.options.bol == 0) {
					var cmd = '\x81\x01\x04\x38\x02\xFF'
				}
				if (event.options.bol == 1) {
					var cmd = '\x81\x01\x04\x38\x03\xFF'
				}
				instance.sendVISCACommand(cmd)
			},
		},
		focusL: {
			name: 'Focus Lock',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x0A\x04\x68\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		focusU: {
			name: 'Focus Unlock',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x0A\x04\x68\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		expM: {
			name: 'Exposure Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Mode setting',
					id: 'val',
					choices: [
						{ id: '0', label: 'Full auto' },
						{ id: '1', label: 'Manual' },
						{ id: '2', label: 'Shutter Pri' },
						{ id: '3', label: 'Iris Pri' },
						{ id: '4', label: 'Bright mode (manual)' },
					],
				},
			],
			callback: async (event) => {
				if (event.options.val == 0) {
					var cmd = '\x81\x01\x04\x39\x00\xFF'
				}
				if (event.options.val == 1) {
					var cmd = '\x81\x01\x04\x39\x03\xFF'
				}
				if (event.options.val == 2) {
					var cmd = '\x81\x01\x04\x39\x0A\xFF'
				}
				if (event.options.val == 3) {
					var cmd = '\x81\x01\x04\x39\x0B\xFF'
				}
				if (event.options.val == 4) {
					var cmd = '\x81\x01\x04\x39\x0D\xFF'
				}
				instance.sendVISCACommand(cmd)
			},
		},
		irisU: {
			name: 'Iris Up',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x0B\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		irisD: {
			name: 'Iris Down',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x0B\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		irisS: {
			name: 'Set Iris',
			options: [
				{
					type: 'dropdown',
					label: 'Iris setting',
					id: 'val',
					choices: IRIS_CHOICES,
				},
			],
			callback: async (event) => {
				var cmd = Buffer.from('\x81\x01\x04\x4B\x00\x00\x00\x00\xFF', 'binary')
				cmd.writeUInt8((parseInt(event.options.val, 16) & 0xf0) >> 4, 6)
				cmd.writeUInt8(parseInt(event.options.val, 16) & 0x0f, 7)
				instance.sendVISCACommand(cmd)
			},
		},
		shutU: {
			name: 'Shutter Up',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x0A\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		shutD: {
			name: 'Shutter Down',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x0A\x03\xFF'
				instance.sendVISCACommand(cmd)
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
					id: 'val',
					choices: PRESET_CHOICES,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x3F\x01' + String.fromCharCode(parseInt(event.options.val, 16) & 0xff) + '\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		recallPset: {
			name: 'Recall Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: 'val',
					choices: PRESET_CHOICES,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x3F\x02' + String.fromCharCode(parseInt(event.options.val, 16) & 0xff) + '\xFF'
				instance.sendVISCACommand(cmd)
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
					id: 'bool',
					choices: [
						{ id: 'off', label: 'off' },
						{ id: 'on', label: 'on' },
					],
				},
			],
			callback: async (event) => {
				if (event.options.bool == 'off') {
					var cmd = '\x81\x01\x04\x00\x03\xFF'
				} else {
					var cmd = '\x81\x01\x04\x00\x02\xFF'
				}
				instance.sendVISCACommand(cmd)
			},
		},
		wb: {
			name: 'White balance',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'val',
					choices: [
						{ id: 'automatic', label: 'Automatic' },
						{ id: 'indoor', label: 'Indoor' },
						{ id: 'outdoor', label: 'Outdoor' },
						{ id: 'onepush', label: 'One Push' },
						{ id: 'manual', label: 'Manual' },
					],
				},
			],
			callback: async (event) => {
				switch (event.options.val) {
					case 'automatic':
						var cmd = '\x81\x01\x04\x35\x00\xFF'
						break
					case 'indoor':
						var cmd = '\x81\x01\x04\x35\x01\xFF'
						break
					case 'outdoor':
						var cmd = '\x81\x01\x04\x35\x02\xFF'
						break
					case 'onepush':
						var cmd = '\x81\x01\x04\x35\x03\xFF'
						break
					case 'manual':
						var cmd = '\x81\x01\x04\x35\x05\xFF'
						break
				}
				instance.sendVISCACommand(cmd)
			},
		},
		wbOPT: {
			name: 'White balance one push trigger',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x10\x05\xFF'
				instance.sendVISCACommand(cmd)
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
