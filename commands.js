import { FocusModeOption } from './options.js'
import { ModuleDefinedCommand } from './visca/command.js'

export const FocusStop = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x08, 0x00, 0xff])
export const FocusNearStandard = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x08, 0x03, 0xff])
export const FocusFarStandard = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x08, 0x02, 0xff])

export const FocusMode = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x38, 0x00, 0xff], {
	[FocusModeOption.id]: {
		nibbles: [9],
		choiceToParam: FocusModeOption.choiceToParam,
	},
})

export const ZoomOut = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x07, 0x03, 0xff])
export const ZoomStop = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x07, 0x00, 0xff])
