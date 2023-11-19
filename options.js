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
