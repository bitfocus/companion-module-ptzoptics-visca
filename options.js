export const FocusModeOption = {
	id: 'bol',
	choices: [
		{ id: '0', label: 'Auto Focus' },
		{ id: '1', label: 'Manual Focus' },
	],
	choiceToParam: (choice) => {
		switch (choice) {
			case '0':
				return 2
			case '1':
				return 3
			default:
				return 2
		}
	},
}

export const ExposureModeOption = {
	id: 'val',
	choices: [
		{ id: '0', label: 'Full auto' },
		{ id: '1', label: 'Manual' },
		{ id: '2', label: 'Shutter Pri' },
		{ id: '3', label: 'Iris Pri' },
		{ id: '4', label: 'Bright mode (manual)' }, // Not in latest API doc: remove?
	],
	choiceToParam: (choice) => {
		switch (choice) {
			case '0':
				return 0x0
			case '1':
				return 0x3
			case '2':
				return 0xa
			case '3':
				return 0xb
			case '4':
				return 0xd
			default:
				return 0x0
		}
	},
}

export const IRIS_CHOICES = [
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
	{ id: '06', label: 'F11' },
	{ id: '00', label: 'CLOSED' },
]

export const IrisSetOption = {
	id: 'val',
	choices: IRIS_CHOICES,
	choiceToParam: (choice) => {
		return parseInt(choice, 16)
	},
}

export const ShutterSetOption = {
	id: 'val',
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
	choiceToParam: (choice) => {
		return parseInt(choice, 16)
	},
}

export const CameraPowerOption = {
	id: 'bool',
	choices: [
		{ id: 'off', label: 'off' },
		{ id: 'on', label: 'on' },
	],
	choiceToParam: (choice) => {
		switch (choice) {
			case 'off':
				return 0x3
			case 'on':
				return 0x2
			default:
				return 0x2
		}
	},
}

export const WhiteBalanceOption = {
	id: 'val',
	choices: [
		{ id: 'automatic', label: 'Automatic' },
		{ id: 'indoor', label: 'Indoor' },
		{ id: 'outdoor', label: 'Outdoor' },
		{ id: 'onepush', label: 'One Push' },
		{ id: 'manual', label: 'Manual' },
	],
	choiceToParam: (choice) => {
		switch (choice) {
			case 'automatic':
				return 0x0
			case 'indoor':
				return 0x1
			case 'outdoor':
				return 0x2
			case 'onepush':
				return 0x3
			case 'manual':
				return 0x5
			default:
				return 0x0
		}
	},
}

const PRESET_CHOICES = []
for (var i = 0; i < 255; ++i) {
	if (i < 90 || i > 99) {
		PRESET_CHOICES.push({ id: ('0' + i.toString(16)).slice(-2), label: i })
	}
}

export const PresetSaveOption = {
	id: 'val',
	choices: PRESET_CHOICES,
	choiceToParam: (choice) => {
		return parseInt(choice, 16)
	},
}

export const PresetRecallOption = {
	id: 'val',
	choices: PRESET_CHOICES,
	choiceToParam: (choice) => {
		return parseInt(choice, 16)
	},
}

export const PresetDriveNumberOption = {
	id: 'val',
	choices: PRESET_CHOICES,
	choiceToParam: (choice) => {
		return parseInt(choice, 16)
	},
}

export const SPEED_CHOICES = [
	{ id: '18', label: 'Speed 24 (Fast)' },
	{ id: '17', label: 'Speed 23' },
	{ id: '16', label: 'Speed 22' },
	{ id: '15', label: 'Speed 21' },
	{ id: '14', label: 'Speed 20' },
	{ id: '13', label: 'Speed 19' },
	{ id: '12', label: 'Speed 18' },
	{ id: '11', label: 'Speed 17' },
	{ id: '10', label: 'Speed 16' },
	{ id: '0F', label: 'Speed 15' },
	{ id: '0E', label: 'Speed 14' },
	{ id: '0D', label: 'Speed 13' },
	{ id: '0C', label: 'Speed 12' },
	{ id: '0B', label: 'Speed 11' },
	{ id: '0A', label: 'Speed 10' },
	{ id: '09', label: 'Speed 09' },
	{ id: '08', label: 'Speed 08' },
	{ id: '07', label: 'Speed 07' },
	{ id: '06', label: 'Speed 06' },
	{ id: '05', label: 'Speed 05' },
	{ id: '04', label: 'Speed 04' },
	{ id: '03', label: 'Speed 03' },
	{ id: '02', label: 'Speed 02' },
	{ id: '01', label: 'Speed 01 (Slow)' },
]

export const PresetDriveSpeedOption = {
	id: 'speed',
	choices: SPEED_CHOICES,
	choiceToParam: (choice) => {
		return parseInt(choice, 16)
	},
}
