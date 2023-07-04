const choices = require('./choices')

exports.getActions = function (instance) {
	var panSpeed = String.fromCharCode(parseInt(instance.ptSpeed, 16) & 0xff)
	var tiltSpeed = String.fromCharCode(Math.min(parseInt(instance.ptSpeed, 16), 0x14) & 0xff)

	const actionDefinitions = {
		left_action: {
			name: 'Pan Left',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x06\x01' + panSpeed + tiltSpeed + '\x01\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		right_action: {
			name: 'Pan Right',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x06\x01' + panSpeed + tiltSpeed + '\x02\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		up_action: {
			name: 'Tilt Up',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x06\x01' + panSpeed + tiltSpeed + '\x03\x01\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		down_action: {
			name: 'Tilt Down',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x06\x01' + panSpeed + tiltSpeed + '\x03\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		up_left_action: {
			name: 'Up Left',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x06\x01' + panSpeed + tiltSpeed + '\x01\x01\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		up_right_action: {
			name: 'Up Right',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x06\x01' + panSpeed + tiltSpeed + '\x02\x01\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		down_left_action: {
			name: 'Down Left',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x06\x01' + panSpeed + tiltSpeed + '\x01\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		down_right_action: {
			name: 'Down Right',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x06\x01' + panSpeed + tiltSpeed + '\x02\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		stop_action: {
			name: 'P/T Stop',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x06\x01' + panSpeed + tiltSpeed + '\x03\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		home_action: {
			name: 'P/T Home',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x06\x04\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		speed_action: {
			name: 'P/T Speed',
			options: [
				{
					type: 'dropdown',
					label: 'speed setting',
					id: 'speed',
					choices: choices.SPEED,
				},
			],
			callback: async (event) => {
				instance.ptSpeed = opt.speed

				var chosenIndex = -1
				for (var i = 0; i < choices.SPEED.length; ++i) {
					if (choices.SPEED[i].id == instance.ptSpeed) {
						chosenIndex = i
						break
					}
				}
				if (chosenIndex > -1) {
					instance.ptSpeedIndex = chosenIndex
				}
			},
		},
		speed_up_action: {
			name: 'P/T Speed Up',
			options: [],
			callback: async (event) => {
				if (instance.ptSpeedIndex == 23) {
					instance.ptSpeedIndex = 23
				} else if (instance.ptSpeedIndex < 23) {
					instance.ptSpeedIndex++
				}
				instance.ptSpeed = choices.SPEED[instance.ptSpeedIndex].id
			},
		},
		speed_down_action: {
			name: 'P/T Speed Down',
			options: [],
			callback: async (event) => {
				if (instance.ptSpeedIndex == 0) {
					instance.ptSpeedIndex = 0
				} else if (instance.ptSpeedIndex > 0) {
					instance.ptSpeedIndex--
				}
				instance.ptSpeed = choices.SPEED[instance.ptSpeedIndex].id
			},
		},
		zoom_in_action: {
			name: 'Zoom In',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x07\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		zoom_out_action: {
			name: 'Zoom Out',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x07\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		zoom_stop_action: {
			name: 'Zoom Stop',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x07\x00\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		focus_near_action: {
			name: 'Focus Near',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x08\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		focus_far_action: {
			name: 'Focus Far',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x08\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		focus_stop_action: {
			name: 'Focus Stop',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x08\x00\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		focus_mode_action: {
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
		focus_lock_action: {
			name: 'Focus Lock',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x0A\x04\x68\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		focus_unlock_action: {
			name: 'Focus Unlock',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x0A\x04\x68\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		exposure_mode_action: {
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
				if (opt.val == 0) {
					var cmd = '\x81\x01\x04\x39\x00\xFF'
				}
				if (opt.val == 1) {
					var cmd = '\x81\x01\x04\x39\x03\xFF'
				}
				if (opt.val == 2) {
					var cmd = '\x81\x01\x04\x39\x0A\xFF'
				}
				if (opt.val == 3) {
					var cmd = '\x81\x01\x04\x39\x0B\xFF'
				}
				if (opt.val == 4) {
					var cmd = '\x81\x01\x04\x39\x0D\xFF'
				}
				instance.sendVISCACommand(cmd)
			},
		},
		iris_up_action: {
			name: 'Iris Up',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x0B\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		iris_down_action: {
			name: 'Iris Down',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x0B\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		set_iris_action: {
			name: 'Set Iris',
			options: [
				{
					type: 'dropdown',
					label: 'Iris setting',
					id: 'val',
					choices: choices.IRIS,
				},
			],
			callback: async (event) => {
				var cmd = Buffer.from('\x81\x01\x04\x4B\x00\x00\x00\x00\xFF', 'binary')
				cmd.writeUInt8((parseInt(event.options.val, 16) & 0xf0) >> 4, 6)
				cmd.writeUInt8(parseInt(event.options.val, 16) & 0x0f, 7)
				instance.sendVISCACommand(cmd)
			},
		},
		shutter_up_action: {
			name: 'Shutter Up',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x0A\x02\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		shutter_down_action: {
			name: 'Shutter Down',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x0A\x03\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		set_shutter_action: {
			name: 'Set Shutter',
			options: [
				{
					type: 'dropdown',
					label: 'Shutter setting',
					id: 'val',
					choices: choices.SHUTTER,
				},
			],
			callback: async (event) => {
				var cmd = Buffer.from('\x81\x01\x04\x4A\x00\x00\x00\x00\xFF', 'binary')
				cmd.writeUInt8((parseInt(event.options.val, 16) & 0xf0) >> 4, 6)
				cmd.writeUInt8(parseInt(event.options.val, 16) & 0x0f, 7)
				instance.sendVISCACommand(cmd)
			},
		},
		save_preset_action: {
			name: 'Save Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: 'val',
					choices: choices.PRESET,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x3F\x01' + String.fromCharCode(parseInt(event.options.val, 16) & 0xff) + '\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		recall_preset_action: {
			name: 'Recall Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: 'val',
					choices: choices.PRESET,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x3F\x02' + String.fromCharCode(parseInt(event.options.val, 16) & 0xff) + '\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		preset_drive_speed_action: {
			name: 'Preset Drive Speed',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: 'val',
					choices: choices.PRESET,
					minChoicesForSearch: 1,
				},
				{
					type: 'dropdown',
					label: 'speed setting',
					id: 'speed',
					choices: choices.SPEED,
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
		power_action: {
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
		white_balance_action: {
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
		white_balance_one_push_trigger_action: {
			name: 'White balance one push trigger',
			options: [],
			callback: async (event) => {
				var cmd = '\x81\x01\x04\x10\x05\xFF'
				instance.sendVISCACommand(cmd)
			},
		},
		auto_white_balance_sensitivity_action: {
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
		custom_command_action: {
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
