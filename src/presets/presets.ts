import type { CompanionPresetDefinitions } from '@companion-module/base'
import { AutoTrackingActionId, TrackingId } from '../actions/auto-tracking.js'
import { OnScreenDisplayMenuStateId, OSDActionId, OSDNavigateDirectionId } from '../actions/osd.js'
import { PresetAsNumberId, PresetAsTextId, PresetIsTextId, RecallPresetId, SetPresetId } from '../actions/presets.js'
import { IMAGE_UP, IMAGE_DOWN, IMAGE_LEFT, IMAGE_RIGHT } from '../assets/assets.js'
import { isValidPreset } from '../camera/presets.js'
import { exposurePresets } from './exposure.js'
import { lensPresets } from './lens.js'
import { panTiltPresets } from './pan-tilt.js'
import { Black, White } from '../utils/colors.js'
import { whiteBalancePresets } from './white-balance.js'

export function getPresets(): CompanionPresetDefinitions {
	const autoTrackingPresets: CompanionPresetDefinitions = {
		auto_tracking_on: {
			type: 'button',
			category: 'Auto Tracking',
			name: 'Auto Tracking On',
			style: {
				text: 'Auto\\nTracking\\nOn',
				size: '14',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: AutoTrackingActionId.AutoTracking,
							options: {
								[TrackingId]: 'on',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},

		auto_tracking_off: {
			type: 'button',
			category: 'Auto Tracking',
			name: 'Auto Tracking Off',
			style: {
				text: 'Auto\\nTracking\\nOff',
				size: '14',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: AutoTrackingActionId.AutoTracking,
							options: {
								[TrackingId]: 'off',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},
	}

	const osdPresets: CompanionPresetDefinitions = {
		osd_toggle: {
			type: 'button',
			category: 'OSD Menu',
			name: 'OSD Menu',
			style: {
				text: 'OSD\\nOpen/Close',
				size: 12,
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: OSDActionId.OSD,
							options: {
								[OnScreenDisplayMenuStateId]: 'toggle',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		},
	}

	for (const [DIRECTION, IMAGE] of [
		['up', IMAGE_UP],
		['right', IMAGE_RIGHT],
		['down', IMAGE_DOWN],
		['left', IMAGE_LEFT],
	]) {
		osdPresets['osd_navigate_' + DIRECTION] = {
			type: 'button',
			category: 'OSD Menu',
			name: 'OSD Navigate',
			style: {
				text: '',
				png64: IMAGE,
				pngalignment: 'center:center',
				size: '18',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: OSDActionId.OSDNavigate,
							options: {
								[OSDNavigateDirectionId]: DIRECTION,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	osdPresets['osd_enter'] = {
		type: 'button',
		category: 'OSD Menu',
		name: 'OSD Enter',
		style: {
			text: 'OSD\\nEnter',
			size: '18',
			color: White,
			bgcolor: Black,
		},
		steps: [
			{
				down: [
					{
						actionId: OSDActionId.OSDEnter,
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	osdPresets['osd_back'] = {
		type: 'button',
		category: 'OSD Menu',
		name: 'OSD Back',
		style: {
			text: 'OSD\\nBack',
			size: '18',
			color: White,
			bgcolor: Black,
		},
		steps: [
			{
				down: [
					{
						actionId: OSDActionId.OSDBack,
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	const presetPresets: CompanionPresetDefinitions = {}

	// generates presets for saving camera presets
	for (let save = 0; save < 255; save++) {
		if (isValidPreset(save)) {
			presetPresets['save_preset_' + save + '_preset'] = {
				type: 'button',
				category: 'Save Preset',
				name: `Save Preset ${save}`,
				style: {
					text: `SAVE\\nPSET\\n${save}`,
					size: '14',
					color: White,
					bgcolor: Black,
				},
				steps: [
					{
						down: [
							{
								actionId: SetPresetId,
								options: {
									[PresetIsTextId]: false,
									[PresetAsNumberId]: save,
									[PresetAsTextId]: `${save}`,
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
	for (let recall = 0; recall < 255; recall++) {
		if (isValidPreset(recall)) {
			presetPresets['recall_preset_' + recall + '_preset'] = {
				type: 'button',
				category: 'Recall Preset',
				name: `Recall Preset ${recall}`,
				style: {
					text: `Recall\\nPSET\\n${recall}`,
					size: '14',
					color: White,
					bgcolor: Black,
				},
				steps: [
					{
						down: [
							{
								actionId: RecallPresetId,
								options: {
									[PresetIsTextId]: false,
									[PresetAsNumberId]: recall,
									[PresetAsTextId]: `${recall}`,
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

	return {
		...panTiltPresets(),
		...lensPresets(),
		...exposurePresets(),
		...whiteBalancePresets(),
		...autoTrackingPresets,
		...osdPresets,
		...presetPresets,
	}
}
