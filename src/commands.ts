import type { CompanionOptionValues } from '@companion-module/base'
import type { MockInstance } from './mock-instance.js'
import {
	AutoTrackingOption,
	AutoWhiteBalanceSensitivityOption,
	CameraPowerOption,
	ExposureModeOption,
	FocusModeOption,
	IrisSetOption,
	OnScreenDisplayNavigateOption,
	OnScreenDisplayOption,
	PresetDriveNumberOption,
	PresetDriveSpeedOption,
	PresetRecallOption,
	PresetSaveOption,
	ShutterSetOption,
	WhiteBalanceOption,
} from './options.js'
import { ModuleDefinedCommand } from './visca/command.js'

export enum PanTiltAction {
	Up,
	Down,
	Left,
	Right,
	UpLeft,
	UpRight,
	DownLeft,
	DownRight,
	Stop,
}

export const PanTiltDirection: { readonly [key in PanTiltAction]: readonly [number, number] } = {
	[PanTiltAction.Up]: [0x03, 0x01],
	[PanTiltAction.Down]: [0x03, 0x02],
	[PanTiltAction.Left]: [0x01, 0x03],
	[PanTiltAction.Right]: [0x02, 0x03],
	[PanTiltAction.UpLeft]: [0x01, 0x01],
	[PanTiltAction.UpRight]: [0x02, 0x01],
	[PanTiltAction.DownLeft]: [0x01, 0x02],
	[PanTiltAction.DownRight]: [0x02, 0x02],
	[PanTiltAction.Stop]: [0x03, 0x03],
}

export async function sendPanTiltCommand(
	instance: MockInstance,
	direction: readonly [number, number],
	panSpeed: number,
	tiltSpeed: number
): Promise<CompanionOptionValues | null> {
	const bytes = [0x81, 0x01, 0x06, 0x01, panSpeed, tiltSpeed, ...direction, 0xff]
	const command = new ModuleDefinedCommand(bytes)
	return instance.sendCommand(command)
}

export const PanTiltHome = new ModuleDefinedCommand([0x81, 0x01, 0x06, 0x04, 0xff])

export const ExposureMode = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x39, 0x00, 0xff], {
	[ExposureModeOption.id]: {
		nibbles: [9],
		choiceToParam: ExposureModeOption.choiceToParam,
	},
})

export const ExposureModeInquiry = new ModuleDefinedCommand([0x81, 0x09, 0x04, 0x39, 0xff], null, [
	{
		value: [0x90, 0x50, 0x00, 0xff],
		mask: [0xff, 0xff, 0xf0, 0xff],
		params: {
			[ExposureModeOption.id]: {
				nibbles: [5],
				paramToChoice: ExposureModeOption.paramToChoice,
			},
		},
	},
])

export const IrisUp = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x0b, 0x02, 0xff])
export const IrisDown = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x0b, 0x03, 0xff])
export const IrisSet = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x4b, 0x00, 0x00, 0x00, 0x00, 0xff], {
	[IrisSetOption.id]: {
		nibbles: [13, 15],
		choiceToParam: IrisSetOption.choiceToParam,
	},
})

export const ShutterUp = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x0a, 0x02, 0xff])
export const ShutterDown = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x0a, 0x03, 0xff])
export const ShutterSet = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x4a, 0x00, 0x00, 0x00, 0x00, 0xff], {
	[ShutterSetOption.id]: {
		nibbles: [13, 15],
		choiceToParam: ShutterSetOption.choiceToParam,
	},
})

export const FocusStop = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x08, 0x00, 0xff])
export const FocusNearStandard = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x08, 0x03, 0xff])
export const FocusFarStandard = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x08, 0x02, 0xff])

export const FocusMode = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x38, 0x00, 0xff], {
	[FocusModeOption.id]: {
		nibbles: [9],
		choiceToParam: FocusModeOption.choiceToParam,
	},
})

export const FocusModeInquiry = new ModuleDefinedCommand([0x81, 0x09, 0x04, 0x38, 0xff], null, [
	{
		value: [0x90, 0x50, 0x00, 0xff],
		mask: [0xff, 0xff, 0xf0, 0xff],
		params: {
			[FocusModeOption.id]: {
				nibbles: [5],
				paramToChoice: FocusModeOption.paramToChoice,
			},
		},
	},
])

export const FocusLock = new ModuleDefinedCommand([0x81, 0x0a, 0x04, 0x68, 0x02, 0xff])
export const FocusUnlock = new ModuleDefinedCommand([0x81, 0x0a, 0x04, 0x68, 0x03, 0xff])

export const ZoomIn = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x07, 0x02, 0xff])
export const ZoomOut = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x07, 0x03, 0xff])
export const ZoomStop = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x07, 0x00, 0xff])

export const CameraPower = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x00, 0x00, 0xff], {
	[CameraPowerOption.id]: {
		nibbles: [9],
		choiceToParam: CameraPowerOption.choiceToParam,
	},
})

export const OnScreenDisplayToggle = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x3f, 0x02, 0x5f, 0xff])
export const OnScreenDisplayClose = new ModuleDefinedCommand([0x81, 0x01, 0x06, 0x06, 0x03, 0xff])

export const OnScreenDisplayInquiry = new ModuleDefinedCommand([0x81, 0x09, 0x06, 0x06, 0xff], null, [
	{
		value: [0x90, 0x50, 0x00, 0xff],
		mask: [0xff, 0xff, 0xf0, 0xff],
		params: {
			[OnScreenDisplayOption.id]: {
				nibbles: [5],
				paramToChoice: OnScreenDisplayOption.paramToChoice,
			},
		},
	},
])

export const OnScreenDisplayNavigate = new ModuleDefinedCommand(
	[0x81, 0x01, 0x06, 0x01, 0x0e, 0x0e, 0x00, 0x00, 0xff],
	{
		[OnScreenDisplayNavigateOption.id]: {
			nibbles: [13, 15],
			choiceToParam: OnScreenDisplayNavigateOption.choiceToParam,
		},
	}
)

export const OnScreenDisplayEnter = new ModuleDefinedCommand([0x81, 0x01, 0x06, 0x06, 0x05, 0xff])
export const OnScreenDisplayBack = new ModuleDefinedCommand([0x81, 0x01, 0x06, 0x06, 0x04, 0xff])

export const WhiteBalance = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x35, 0x00, 0xff], {
	[WhiteBalanceOption.id]: {
		nibbles: [9],
		choiceToParam: WhiteBalanceOption.choiceToParam,
	},
})

export const WhiteBalanceOnePushTrigger = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x10, 0x05, 0xff])

export const AutoWhiteBalanceSensitivity = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0xa9, 0x00, 0xff], {
	[AutoWhiteBalanceSensitivityOption.id]: {
		nibbles: [9],
		choiceToParam: AutoWhiteBalanceSensitivityOption.choiceToParam,
	},
})

export const PresetSave = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x3f, 0x01, 0x00, 0xff], {
	[PresetSaveOption.id]: {
		nibbles: [10, 11],
		choiceToParam: PresetSaveOption.choiceToParam,
	},
})

export const PresetRecall = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x3f, 0x02, 0x00, 0xff], {
	[PresetRecallOption.id]: {
		nibbles: [10, 11],
		choiceToParam: PresetRecallOption.choiceToParam,
	},
})

export const PresetDriveSpeed = new ModuleDefinedCommand([0x81, 0x01, 0x06, 0x01, 0x0, 0x0, 0xff], {
	[PresetDriveNumberOption.id]: {
		nibbles: [8, 9],
		choiceToParam: PresetDriveNumberOption.choiceToParam,
	},
	[PresetDriveSpeedOption.id]: {
		nibbles: [10, 11],
		choiceToParam: PresetDriveSpeedOption.choiceToParam,
	},
})

// PTZOptics G3 VISCA over IP Commands, 10/27/2023:
// 81 0A 11 54 0p FF, p: 0x2=On, 0x3=Off
export const AutoTracking = new ModuleDefinedCommand([0x81, 0x0a, 0x11, 0x54, 0x00, 0xff], {
	[AutoTrackingOption.id]: {
		nibbles: [9],
		choiceToParam: AutoTrackingOption.choiceToParam,
	},
})
