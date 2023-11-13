import { combineRgb } from '@companion-module/base'
import {
	IMAGE_UP,
	IMAGE_DOWN,
	IMAGE_LEFT,
	IMAGE_RIGHT,
	IMAGE_UP_RIGHT,
	IMAGE_UP_LEFT,
	IMAGE_DOWN_LEFT,
	IMAGE_DOWN_RIGHT,
} from './assets/assets.js'

export function getPresets() {
	const presets = {}

	presets['tilt_up_preset'] = {
		type: 'button',
		category: 'Pan/Tilt',
		name: 'UP',
		style: {
			text: '',
			png64: IMAGE_UP,
			pngalignment: 'center:center',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 255),
		},
		steps: [
			{
				down: [
					{
						actionId: 'up',
					},
				],
				up: [
					{
						actionId: 'stop',
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['tilt_down_preset'] = {
		type: 'button',
		category: 'Pan/Tilt',
		name: 'DOWN',
		style: {
			text: '',
			png64: IMAGE_DOWN,
			pngalignment: 'center:center',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'down',
					},
				],
				up: [
					{
						actionId: 'stop',
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['pan_left_preset'] = {
		type: 'button',
		category: 'Pan/Tilt',
		name: 'LEFT',
		style: {
			text: '',
			png64: IMAGE_LEFT,
			pngalignment: 'center:center',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'left',
					},
				],
				up: [
					{
						actionId: 'stop',
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['pan_right_preset'] = {
		type: 'button',
		category: 'Pan/Tilt',
		name: 'RIGHT',
		style: {
			text: '',
			png64: IMAGE_RIGHT,
			pngalignment: 'center:center',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'right',
					},
				],
				up: [
					{
						actionId: 'stop',
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['pt_up_right_preset'] = {
		type: 'button',
		category: 'Pan/Tilt',
		name: 'UP RIGHT',
		style: {
			text: '',
			png64: IMAGE_UP_RIGHT,
			pngalignment: 'center:center',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'upRight',
					},
				],
				up: [
					{
						actionId: 'stop',
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['pt_up_left_preset'] = {
		type: 'button',
		category: 'Pan/Tilt',
		name: 'UP LEFT',
		style: {
			text: '',
			png64: IMAGE_UP_LEFT,
			pngalignment: 'center:center',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'upLeft',
					},
				],
				up: [
					{
						actionId: 'stop',
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['pt_down_left_preset'] = {
		type: 'button',
		category: 'Pan/Tilt',
		name: 'DOWN LEFT',
		style: {
			text: '',
			png64: IMAGE_DOWN_LEFT,
			pngalignment: 'center:center',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'downLeft',
					},
				],
				up: [
					{
						actionId: 'stop',
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['pt_down_right_preset'] = {
		type: 'button',
		category: 'Pan/Tilt',
		name: 'DOWN RIGHT',
		style: {
			text: '',
			png64: IMAGE_DOWN_RIGHT,
			pngalignment: 'center:center',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'downRight',
					},
				],
				up: [
					{
						actionId: 'stop',
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['home_preset'] = {
		type: 'button',
		category: 'Pan/Tilt',
		name: 'Home',
		style: {
			text: 'HOME',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'home',
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['speed_up_preset'] = {
		type: 'button',
		category: 'Pan/Tilt',
		name: 'Speed Up',
		style: {
			text: 'SPEED\\nUP',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'ptSpeedU',
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['speed_down_preset'] = {
		type: 'button',
		category: 'Pan/Tilt',
		name: 'Speed Down',
		style: {
			text: 'SPEED\\nDOWN',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'ptSpeedD',
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['zoom_in_preset'] = {
		type: 'button',
		category: 'Lens',
		name: 'Zoom In',
		style: {
			text: 'ZOOM\\nIN',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'zoomI',
					},
				],
				up: [
					{
						actionId: 'zoomS',
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['zoom_out_preset'] = {
		type: 'button',
		category: 'Lens',
		name: 'Zoom Out',
		style: {
			text: 'ZOOM\\nOUT',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'zoomO',
					},
				],
				up: [
					{
						actionId: 'zoomS',
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['focus_near_preset'] = {
		type: 'button',
		category: 'Lens',
		name: 'Focus Near',
		style: {
			text: 'FOCUS\\nNEAR',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'focusN',
					},
				],
				up: [
					{
						actionId: 'focusS',
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['focus_far_preset'] = {
		type: 'button',
		category: 'Lens',
		name: 'Focus Far',
		style: {
			text: 'FOCUS\\nFAR',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'focusF',
					},
				],
				up: [
					{
						actionId: 'focusS',
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['auto_focus_preset'] = {
		type: 'button',
		category: 'Lens',
		name: 'Auto Focus',
		style: {
			text: 'AUTO\\nFOCUS',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
			latch: true,
		},
		steps: [
			{
				down: [
					{
						actionId: 'focusM',
						options: {
							bol: 0,
						},
					},
				],
				up: [
					{
						actionId: 'focusM',
						options: {
							bol: 1,
						},
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['focus_lock_preset'] = {
		type: 'button',
		category: 'Lens',
		name: 'Focus Lock',
		style: {
			text: 'FOCUS\\nLOCK',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'focusL',
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['focus_unlock_preset'] = {
		type: 'button',
		category: 'Lens',
		name: 'Focus Unlock',
		style: {
			text: 'FOCUS\\nUNLOCK',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'focusU',
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['exposure_mode_preset'] = {
		type: 'button',
		category: 'Exposure',
		name: 'Exposure Mode',
		style: {
			text: 'EXP\\nMODE',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'expM',
						options: {
							bol: 0,
						},
					},
				],
				up: [],
			},
			{
				down: [
					{
						actionId: 'expM',
						options: {
							bol: 1,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['iris_up_preset'] = {
		type: 'button',
		category: 'Exposure',
		name: 'Iris Up',
		style: {
			text: 'IRIS\\nUP',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'irisU',
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['iris_down_preset'] = {
		type: 'button',
		category: 'Exposure',
		name: 'Iris Down',
		style: {
			text: 'IRIS\\nDOWN',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'irisD',
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['shutter_up_preset'] = {
		type: 'button',
		category: 'Exposure',
		name: 'Shutter Up',
		style: {
			text: 'Shut\\nUP',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'shutU',
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['shutter_down_preset'] = {
		type: 'button',
		category: 'Exposure',
		name: 'Shutter Down',
		style: {
			text: 'Shut\\nDOWN',
			size: '18',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'shutD',
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['auto_white_balance_preset'] = {
		type: 'button',
		category: 'White balance',
		name: 'Auto White Balance',
		style: {
			text: 'WB\\nAUTO',
			size: '14',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'wb',
						options: {
							val: 'automatic',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['indoor_white_balance_preset'] = {
		type: 'button',
		category: 'White balance',
		name: 'Indoor White Balance',
		style: {
			text: 'WB\\nINDOOR',
			size: '14',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'wb',
						options: {
							val: 'indoor',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['outdoor_white_balance_preset'] = {
		type: 'button',
		category: 'White balance',
		name: 'Outdoor White Balance',
		style: {
			text: 'WB\\nOUT\\nDOOR',
			size: '14',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'wb',
						options: {
							val: 'outdoor',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['one_push_white_balance_preset'] = {
		type: 'button',
		category: 'White balance',
		name: 'One Push White Balance',
		style: {
			text: 'WB\\nONE PUSH',
			size: '14',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'wb',
						options: {
							val: 'onepush',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['trigger_one_push_white_balance_preset'] = {
		type: 'button',
		category: 'White balance',
		name: 'Trigger One Push White Balance',
		style: {
			text: 'WB\\nTRIGGER\\nONE PUSH',
			size: '14',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'wbOPT',
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// generates presets for saving camera presets
	for (var save = 0; save < 255; save++) {
		if (save < 90 || save > 99) {
			presets['save_preset_' + save + '_preset'] = {
				type: 'button',
				category: 'Save Preset',
				name: 'Save Preset ' + parseInt(save),
				style: {
					style: 'text',
					text: 'SAVE\\nPSET\\n' + parseInt(save),
					size: '14',
					color: '16777215',
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'savePset',
								options: {
									val: ('0' + save.toString(16)).slice(-2),
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		}
	}

	// generates presets for recalling camera presets
	for (var recall = 0; recall < 255; recall++) {
		if (recall < 90 || recall > 99) {
			presets['recall_preset_' + recall + '_preset'] = {
				type: 'button',
				category: 'Recall Preset',
				name: 'Recall Preset ' + parseInt(recall),
				style: {
					style: 'text',
					text: 'Recall\\nPSET\\n' + parseInt(recall),
					size: '14',
					color: '16777215',
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'recallPset',
								options: {
									val: ('0' + recall.toString(16)).slice(-2),
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		}
	}

	return presets
}
