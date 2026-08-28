import type { CompanionButtonPresetDefinition, CompanionPresetDefinitions } from '@companion-module/base'
import { PresetAsNumberId, PresetAsTextId, PresetIsTextId, RecallPresetId, SetPresetId } from '../actions/presets.js'
import { isValidPreset } from '../camera/presets.js'
import { Black, White } from '../utils/colors.js'

export function cameraPresets(): CompanionPresetDefinitions {
	return {
		...Object.fromEntries(
			Array(255)
				.keys()
				.flatMap((num): [string, CompanionButtonPresetDefinition][] => {
					if (!isValidPreset(num)) {
						return []
					}

					return [
						[
							'save_preset_' + num + '_preset',
							{
								type: 'button',
								category: 'Save Preset',
								name: `Save Preset ${num}`,
								style: {
									text: `SAVE\\nPSET\\n${num}`,
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
													[PresetAsNumberId]: num,
													[PresetAsTextId]: `${num}`,
												},
											},
										],
										up: [],
									},
								],
								feedbacks: [],
							},
						],
						[
							'recall_preset_' + num + '_preset',
							{
								type: 'button',
								category: 'Recall Preset',
								name: `Recall Preset ${num}`,
								style: {
									text: `Recall\\nPSET\\n${num}`,
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
													[PresetAsNumberId]: num,
													[PresetAsTextId]: `${num}`,
												},
											},
										],
										up: [],
									},
								],
								feedbacks: [],
							},
						],
					]
				}),
		),
	}
}
