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
