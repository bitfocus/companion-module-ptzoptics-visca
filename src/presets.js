import { combineRgb } from '@companion-module/base'
import { PtzOpticsActionId } from './actions-enum.js'
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
import { OnScreenDisplayNavigateOption, OnScreenDisplayOption } from './options.js'

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
						actionId: PtzOpticsActionId.PanTiltUp,
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.PanTiltStop,
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
						actionId: PtzOpticsActionId.PanTiltDown,
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.PanTiltStop,
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
						actionId: PtzOpticsActionId.PanTiltLeft,
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.PanTiltStop,
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
						actionId: PtzOpticsActionId.PanTiltRight,
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.PanTiltStop,
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
						actionId: PtzOpticsActionId.PanTiltUpRight,
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.PanTiltStop,
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
						actionId: PtzOpticsActionId.PanTiltUpLeft,
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.PanTiltStop,
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
						actionId: PtzOpticsActionId.PanTiltDownLeft,
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.PanTiltStop,
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
						actionId: PtzOpticsActionId.PanTiltDownRight,
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.PanTiltStop,
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
						actionId: PtzOpticsActionId.PanTiltHome,
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
						actionId: PtzOpticsActionId.PanTiltSpeedUp,
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
						actionId: PtzOpticsActionId.PanTiltSpeedDown,
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
						actionId: PtzOpticsActionId.StartZoomIn,
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.StopZoom,
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
						actionId: PtzOpticsActionId.StartZoomOut,
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.StopZoom,
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
						actionId: PtzOpticsActionId.StartFocusNearer,
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.StopFocus,
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
						actionId: PtzOpticsActionId.StartFocusFarther,
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.StopFocus,
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
						actionId: PtzOpticsActionId.SelectFocusMode,
						options: {
							bol: 0,
						},
					},
				],
				up: [
					{
						actionId: PtzOpticsActionId.SelectFocusMode,
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
						actionId: PtzOpticsActionId.LockFocus,
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
						actionId: PtzOpticsActionId.UnlockFocus,
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
						actionId: PtzOpticsActionId.SelectExposureMode,
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
						actionId: PtzOpticsActionId.SelectExposureMode,
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
						actionId: PtzOpticsActionId.IrisUp,
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
						actionId: PtzOpticsActionId.IrisDown,
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
						actionId: PtzOpticsActionId.ShutterUp,
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
						actionId: PtzOpticsActionId.ShutterDown,
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
						actionId: PtzOpticsActionId.SelectWhiteBalance,
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
						actionId: PtzOpticsActionId.SelectWhiteBalance,
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
						actionId: PtzOpticsActionId.SelectWhiteBalance,
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
						actionId: PtzOpticsActionId.SelectWhiteBalance,
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
						actionId: PtzOpticsActionId.WhiteBalanceOnePushTrigger,
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['auto_tracking_on'] = {
		type: 'button',
		category: 'Auto Tracking',
		name: 'Auto Tracking On',
		style: {
			text: 'Auto\\nTracking\\nOn',
			size: '14',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: PtzOpticsActionId.AutoTracking,
						options: {
							tracking: 'on',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['auto_tracking_off'] = {
		type: 'button',
		category: 'Auto Tracking',
		name: 'Auto Tracking Off',
		style: {
			text: 'Auto\\nTracking\\nOff',
			size: '14',
			color: '16777215',
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: PtzOpticsActionId.AutoTracking,
						options: {
							tracking: 'off',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['osd_toggle'] = {
		type: 'button',
		category: 'OSD Menu',
		name: 'OSD Menu',
		style: {
			text: 'OSD\\nOpen/Close',
			size: 12,
			color: combineRgb(0xff, 0xff, 0xff),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: PtzOpticsActionId.OSD,
						options: {
							[OnScreenDisplayOption.id]: 'toggle',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	for (const [DIRECTION, IMAGE] of [
		['up', IMAGE_UP],
		['right', IMAGE_RIGHT],
		['down', IMAGE_DOWN],
		['left', IMAGE_LEFT],
	]) {
		presets['osd_navigate_' + DIRECTION] = {
			type: 'button',
			category: 'OSD Menu',
			name: 'OSD Navigate',
			style: {
				text: '',
				png64: IMAGE,
				pngalignment: 'center:center',
				size: '18',
				color: combineRgb(0xff, 0xff, 0xff),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: PtzOpticsActionId.OSDNavigate,
							options: {
								[OnScreenDisplayNavigateOption.id]: DIRECTION,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	presets['osd_enter'] = {
		type: 'button',
		category: 'OSD Menu',
		name: 'OSD Enter',
		style: {
			text: 'OSD\\nEnter',
			size: '18',
			color: combineRgb(0xff, 0xff, 0xff),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: PtzOpticsActionId.OSDEnter,
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['osd_back'] = {
		type: 'button',
		category: 'OSD Menu',
		name: 'OSD Back',
		style: {
			text: 'OSD\\nBack',
			size: '18',
			color: combineRgb(0xff, 0xff, 0xff),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: PtzOpticsActionId.OSDBack,
						options: {},
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
								actionId: PtzOpticsActionId.SetPreset,
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
								actionId: PtzOpticsActionId.RecallPreset,
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
