import type { CompanionPresetDefinitions } from '@companion-module/base'
import { PanTiltActionId } from '../actions/pan-tilt.js'
import {
	IMAGE_UP,
	IMAGE_DOWN,
	IMAGE_LEFT,
	IMAGE_RIGHT,
	IMAGE_UP_RIGHT,
	IMAGE_UP_LEFT,
	IMAGE_DOWN_LEFT,
	IMAGE_DOWN_RIGHT,
} from '../assets/assets.js'
import { Black, Blue, White } from '../utils/colors.js'

export function panTiltPresets(): CompanionPresetDefinitions {
	return {
		tilt_up_preset: {
			type: 'button',
			category: 'Pan/Tilt',
			name: 'UP',
			style: {
				text: '',
				png64: IMAGE_UP,
				pngalignment: 'center:center',
				size: '18',
				color: White,
				bgcolor: Blue,
			},
			steps: [
				{
					down: [
						{
							actionId: PanTiltActionId.TiltUp,
							options: {},
						},
					],
					up: [
						{
							actionId: PanTiltActionId.StopMoving,
							options: {},
						},
					],
				},
			],
			feedbacks: [],
		},

		tilt_down_preset: {
			type: 'button',
			category: 'Pan/Tilt',
			name: 'DOWN',
			style: {
				text: '',
				png64: IMAGE_DOWN,
				pngalignment: 'center:center',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: PanTiltActionId.TiltDown,
							options: {},
						},
					],
					up: [
						{
							actionId: PanTiltActionId.StopMoving,
							options: {},
						},
					],
				},
			],
			feedbacks: [],
		},

		pan_left_preset: {
			type: 'button',
			category: 'Pan/Tilt',
			name: 'LEFT',
			style: {
				text: '',
				png64: IMAGE_LEFT,
				pngalignment: 'center:center',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: PanTiltActionId.PanLeft,
							options: {},
						},
					],
					up: [
						{
							actionId: PanTiltActionId.StopMoving,
							options: {},
						},
					],
				},
			],
			feedbacks: [],
		},

		pan_right_preset: {
			type: 'button',
			category: 'Pan/Tilt',
			name: 'RIGHT',
			style: {
				text: '',
				png64: IMAGE_RIGHT,
				pngalignment: 'center:center',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: PanTiltActionId.PanRight,
							options: {},
						},
					],
					up: [
						{
							actionId: PanTiltActionId.StopMoving,
							options: {},
						},
					],
				},
			],
			feedbacks: [],
		},

		pt_up_right_preset: {
			type: 'button',
			category: 'Pan/Tilt',
			name: 'UP RIGHT',
			style: {
				text: '',
				png64: IMAGE_UP_RIGHT,
				pngalignment: 'center:center',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: PanTiltActionId.MoveUpRight,
							options: {},
						},
					],
					up: [
						{
							actionId: PanTiltActionId.StopMoving,
							options: {},
						},
					],
				},
			],
			feedbacks: [],
		},

		pt_up_left_preset: {
			type: 'button',
			category: 'Pan/Tilt',
			name: 'UP LEFT',
			style: {
				text: '',
				png64: IMAGE_UP_LEFT,
				pngalignment: 'center:center',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: PanTiltActionId.MoveUpLeft,
							options: {},
						},
					],
					up: [
						{
							actionId: PanTiltActionId.StopMoving,
							options: {},
						},
					],
				},
			],
			feedbacks: [],
		},

		pt_down_left_preset: {
			type: 'button',
			category: 'Pan/Tilt',
			name: 'DOWN LEFT',
			style: {
				text: '',
				png64: IMAGE_DOWN_LEFT,
				pngalignment: 'center:center',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: PanTiltActionId.MoveDownLeft,
							options: {},
						},
					],
					up: [
						{
							actionId: PanTiltActionId.StopMoving,
							options: {},
						},
					],
				},
			],
			feedbacks: [],
		},

		pt_down_right_preset: {
			type: 'button',
			category: 'Pan/Tilt',
			name: 'DOWN RIGHT',
			style: {
				text: '',
				png64: IMAGE_DOWN_RIGHT,
				pngalignment: 'center:center',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: PanTiltActionId.MoveDownRight,
							options: {},
						},
					],
					up: [
						{
							actionId: PanTiltActionId.StopMoving,
							options: {},
						},
					],
				},
			],
			feedbacks: [],
		},

		home_preset: {
			type: 'button',
			category: 'Pan/Tilt',
			name: 'Home',
			style: {
				text: 'HOME',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: PanTiltActionId.ResetToHome,
							options: {},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		speed_up_preset: {
			type: 'button',
			category: 'Pan/Tilt',
			name: 'Speed Up',
			style: {
				text: 'SPEED\\nUP',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: PanTiltActionId.SpeedUpMovement,
							options: {},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		speed_down_preset: {
			type: 'button',
			category: 'Pan/Tilt',
			name: 'Speed Down',
			style: {
				text: 'SPEED\\nDOWN',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: PanTiltActionId.SlowDownMovement,
							options: {},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},
	}
}
