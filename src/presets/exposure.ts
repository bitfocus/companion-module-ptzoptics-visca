import type { CompanionPresetDefinitions } from '@companion-module/base'
import { ExposureActionId, ExposureModeId } from '../actions/exposure.js'
import { Black, White } from '../utils/colors.js'

export function exposurePresets(): CompanionPresetDefinitions {
	return {
		exposure_mode_preset: {
			type: 'button',
			category: 'Exposure',
			name: 'Exposure Mode',
			style: {
				text: 'EXP\\nMODE',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: ExposureActionId.SelectExposureMode,
							options: {
								[ExposureModeId]: 0,
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: ExposureActionId.SelectExposureMode,
							options: {
								[ExposureModeId]: 1,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		iris_up_preset: {
			type: 'button',
			category: 'Exposure',
			name: 'Iris Up',
			style: {
				text: 'IRIS\\nUP',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: ExposureActionId.IrisUp,
							options: {},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		iris_down_preset: {
			type: 'button',
			category: 'Exposure',
			name: 'Iris Down',
			style: {
				text: 'IRIS\\nDOWN',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: ExposureActionId.IrisDown,
							options: {},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		shutter_up_preset: {
			type: 'button',
			category: 'Exposure',
			name: 'Shutter Up',
			style: {
				text: 'Shut\\nUP',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: ExposureActionId.ShutterUp,
							options: {},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		shutter_down_preset: {
			type: 'button',
			category: 'Exposure',
			name: 'Shutter Down',
			style: {
				text: 'Shut\\nDOWN',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: ExposureActionId.ShutterDown,
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
