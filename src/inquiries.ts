import { ExposureModeOption, FocusModeOption, OnScreenDisplayOption } from './options.js'
import { ModuleDefinedInquiry } from './visca/command.js'

export const ExposureModeInquiry = new ModuleDefinedInquiry([0x81, 0x09, 0x04, 0x39, 0xff], {
	value: [0x90, 0x50, 0x00, 0xff],
	mask: [0xff, 0xff, 0xf0, 0xff],
	params: {
		[ExposureModeOption.id]: {
			nibbles: [5],
			paramToChoice: ExposureModeOption.paramToChoice,
		},
	},
})

export const FocusModeInquiry = new ModuleDefinedInquiry([0x81, 0x09, 0x04, 0x38, 0xff], {
	value: [0x90, 0x50, 0x00, 0xff],
	mask: [0xff, 0xff, 0xf0, 0xff],
	params: {
		[FocusModeOption.id]: {
			nibbles: [5],
			paramToChoice: FocusModeOption.paramToChoice,
		},
	},
})

export const OnScreenDisplayInquiry = new ModuleDefinedInquiry([0x81, 0x09, 0x06, 0x06, 0xff], {
	value: [0x90, 0x50, 0x00, 0xff],
	mask: [0xff, 0xff, 0xf0, 0xff],
	params: {
		[OnScreenDisplayOption.id]: {
			nibbles: [5],
			paramToChoice: OnScreenDisplayOption.paramToChoice,
		},
	},
})
