import type { CompanionPresetDefinitions } from '@companion-module/base'
import { PresetAsNumberId, PresetAsTextId, PresetIsTextId, RecallPresetId, SetPresetId } from '../actions/presets.js'
import { autoTrackingPresets } from './auto-tracking.js'
import { isValidPreset } from '../camera/presets.js'
import { exposurePresets } from './exposure.js'
import { lensPresets } from './lens.js'
import { osdPresets } from './osd.js'
import { panTiltPresets } from './pan-tilt.js'
import { Black, White } from '../utils/colors.js'
import { whiteBalancePresets } from './white-balance.js'

export function getPresets(): CompanionPresetDefinitions {
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
		...autoTrackingPresets(),
		...osdPresets(),
		...presetPresets,
	}
}
