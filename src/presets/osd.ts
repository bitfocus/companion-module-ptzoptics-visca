import type { CompanionButtonPresetDefinition, CompanionPresetDefinitions } from '@companion-module/base'
import { OnScreenDisplayMenuStateId, OSDActionId, OSDNavigateDirectionId } from '../actions/osd.js'
import { IMAGE_UP, IMAGE_DOWN, IMAGE_LEFT, IMAGE_RIGHT } from '../assets/assets.js'
import { Black, White } from '../utils/colors.js'

export function osdPresets(): CompanionPresetDefinitions {
	return {
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

		...Object.fromEntries(
			(
				[
					['up', IMAGE_UP],
					['right', IMAGE_RIGHT],
					['down', IMAGE_DOWN],
					['left', IMAGE_LEFT],
				] as const
			).map(([DIRECTION, IMAGE]): [string, CompanionButtonPresetDefinition] => {
				return [
					'osd_navigate_' + DIRECTION,
					{
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
					},
				]
			}),
		),

		osd_enter: {
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
		},

		osd_back: {
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
		},
	}
}
