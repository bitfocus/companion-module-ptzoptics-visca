import type { CompanionPresetDefinitions } from '@companion-module/base'
import { FocusActionId, FocusModeId } from '../actions/focus.js'
import { ZoomActionId } from '../actions/zoom.js'
import { Black, White } from '../utils/colors.js'

export function lensPresets(): CompanionPresetDefinitions {
	return {
		zoom_in_preset: {
			type: 'button',
			category: 'Lens',
			name: 'Zoom In',
			style: {
				text: 'ZOOM\\nIN',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: ZoomActionId.StartZoomIn,
							options: {},
						},
					],
					up: [
						{
							actionId: ZoomActionId.StopZoom,
							options: {},
						},
					],
				},
			],
			feedbacks: [],
		},

		zoom_out_preset: {
			type: 'button',
			category: 'Lens',
			name: 'Zoom Out',
			style: {
				text: 'ZOOM\\nOUT',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: ZoomActionId.StartZoomOut,
							options: {},
						},
					],
					up: [
						{
							actionId: ZoomActionId.StopZoom,
							options: {},
						},
					],
				},
			],
			feedbacks: [],
		},

		focus_near_preset: {
			type: 'button',
			category: 'Lens',
			name: 'Focus Near',
			style: {
				text: 'FOCUS\\nNEAR',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: FocusActionId.StartFocusNearer,
							options: {},
						},
					],
					up: [
						{
							actionId: FocusActionId.StopFocus,
							options: {},
						},
					],
				},
			],
			feedbacks: [],
		},

		focus_far_preset: {
			type: 'button',
			category: 'Lens',
			name: 'Focus Far',
			style: {
				text: 'FOCUS\\nFAR',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: FocusActionId.StartFocusFarther,
							options: {},
						},
					],
					up: [
						{
							actionId: FocusActionId.StopFocus,
							options: {},
						},
					],
				},
			],
			feedbacks: [],
		},

		auto_focus_preset: {
			type: 'button',
			category: 'Lens',
			name: 'Auto Focus',
			style: {
				text: 'AUTO\\nFOCUS',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: FocusActionId.SelectFocusMode,
							options: {
								[FocusModeId]: 0,
							},
						},
					],
					up: [
						{
							actionId: FocusActionId.SelectFocusMode,
							options: {
								[FocusModeId]: 1,
							},
						},
					],
				},
			],
			feedbacks: [],
		},

		focus_lock_preset: {
			type: 'button',
			category: 'Lens',
			name: 'Focus Lock',
			style: {
				text: 'FOCUS\\nLOCK',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: FocusActionId.LockFocus,
							options: {},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		focus_unlock_preset: {
			type: 'button',
			category: 'Lens',
			name: 'Focus Unlock',
			style: {
				text: 'FOCUS\\nUNLOCK',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: FocusActionId.UnlockFocus,
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
