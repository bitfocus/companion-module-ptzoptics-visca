import { PtzOpticsActionId } from './actions-enum.js'
import {
	AutoTracking,
	AutoWhiteBalanceSensitivity,
	CameraPower,
	ExposureMode,
	ExposureModeInquiry,
	FocusFarStandard,
	FocusLock,
	FocusMode,
	FocusModeInquiry,
	FocusNearStandard,
	FocusStop,
	FocusUnlock,
	IrisDown,
	IrisSet,
	IrisUp,
	OnScreenDisplayBack,
	OnScreenDisplayClose,
	OnScreenDisplayEnter,
	OnScreenDisplayInquiry,
	OnScreenDisplayNavigate,
	OnScreenDisplayToggle,
	PanTiltAction,
	PanTiltDirection,
	PanTiltHome,
	PresetDriveSpeed,
	PresetRecall,
	PresetSave,
	ShutterDown,
	ShutterSet,
	ShutterUp,
	WhiteBalance,
	WhiteBalanceOnePushTrigger,
	ZoomIn,
	ZoomOut,
	ZoomStop,
	sendPanTiltCommand,
} from './commands.js'
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
	SPEED_CHOICES,
	WhiteBalanceOption,
} from './options.js'
import { generateCustomCommandAction } from './custom-command-action.js'

export function getActions(instance) {
	function createPanTiltCallback(direction) {
		return async (event) => {
			const { panSpeed, tiltSpeed } = instance.panTiltSpeed()
			sendPanTiltCommand(instance, direction, panSpeed, tiltSpeed)
		}
	}

	const actionDefinitions = {
		[PtzOpticsActionId.PanTiltLeft]: {
			name: 'Pan Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Left]),
		},
		[PtzOpticsActionId.PanTiltRight]: {
			name: 'Pan Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Right]),
		},
		[PtzOpticsActionId.PanTiltUp]: {
			name: 'Tilt Up',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Up]),
		},
		[PtzOpticsActionId.PanTiltDown]: {
			name: 'Tilt Down',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Down]),
		},
		[PtzOpticsActionId.PanTiltUpLeft]: {
			name: 'Up Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.UpLeft]),
		},
		[PtzOpticsActionId.PanTiltUpRight]: {
			name: 'Up Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.UpRight]),
		},
		[PtzOpticsActionId.PanTiltDownLeft]: {
			name: 'Down Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.DownLeft]),
		},
		[PtzOpticsActionId.PanTiltDownRight]: {
			name: 'Down Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.DownRight]),
		},
		[PtzOpticsActionId.PanTiltStop]: {
			name: 'P/T Stop',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection[PanTiltAction.Stop]),
		},
		[PtzOpticsActionId.PanTiltHome]: {
			name: 'P/T Home',
			options: [],
			callback: async (event) => {
				instance.sendCommand(PanTiltHome)
			},
		},
		[PtzOpticsActionId.PanTiltSetSpeed]: {
			name: 'P/T Speed',
			options: [
				{
					type: 'dropdown',
					label: 'speed setting',
					id: 'speed',
					choices: SPEED_CHOICES,
				},
			],
			callback: async (event) => {
				const speed = parseInt(event.options.speed, 16)
				instance.setPanTiltSpeed(speed)
			},
		},
		[PtzOpticsActionId.PanTiltSpeedUp]: {
			name: 'P/T Speed Up',
			options: [],
			callback: async (event) => {
				instance.increasePanTiltSpeed()
			},
		},
		[PtzOpticsActionId.PanTiltSpeedDown]: {
			name: 'P/T Speed Down',
			options: [],
			callback: async (event) => {
				instance.decreasePanTiltSpeed()
			},
		},
		[PtzOpticsActionId.StartZoomIn]: {
			name: 'Zoom In',
			options: [],
			callback: async (event) => {
				instance.sendCommand(ZoomIn)
			},
		},
		[PtzOpticsActionId.StartZoomOut]: {
			name: 'Zoom Out',
			options: [],
			callback: async (event) => {
				instance.sendCommand(ZoomOut, event.options)
			},
		},
		[PtzOpticsActionId.StopZoom]: {
			name: 'Zoom Stop',
			options: [],
			callback: async (event) => {
				instance.sendCommand(ZoomStop)
			},
		},
		[PtzOpticsActionId.StartFocusNearer]: {
			name: 'Focus Near',
			options: [],
			callback: async (event) => {
				instance.sendCommand(FocusNearStandard)
			},
		},
		[PtzOpticsActionId.StartFocusFarther]: {
			name: 'Focus Far',
			options: [],
			callback: async (event) => {
				instance.sendCommand(FocusFarStandard)
			},
		},
		[PtzOpticsActionId.StopFocus]: {
			name: 'Focus Stop',
			options: [],
			callback: async (event) => {
				instance.sendCommand(FocusStop)
			},
		},
		[PtzOpticsActionId.SelectFocusMode]: {
			name: 'Focus Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Auto / Manual Focus',
					id: FocusModeOption.id,
					choices: FocusModeOption.choices,
				},
			],
			callback: async (event) => {
				instance.sendCommand(FocusMode, event.options)
			},
			learn: async (event) => {
				const opts = await instance.sendCommand(FocusModeInquiry)
				if (opts === null) return undefined
				return { ...opts }
			},
		},
		[PtzOpticsActionId.LockFocus]: {
			name: 'Focus Lock',
			options: [],
			callback: async (event) => {
				instance.sendCommand(FocusLock)
			},
		},
		[PtzOpticsActionId.UnlockFocus]: {
			name: 'Focus Unlock',
			options: [],
			callback: async (event) => {
				instance.sendCommand(FocusUnlock)
			},
		},
		[PtzOpticsActionId.SelectExposureMode]: {
			name: 'Exposure Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Mode setting',
					id: ExposureModeOption.id,
					choices: ExposureModeOption.choices,
				},
			],
			callback: async (event) => {
				instance.sendCommand(ExposureMode, event.options)
			},
			learn: async (action) => {
				const opts = await instance.sendCommand(ExposureModeInquiry)
				if (opts === null) return undefined
				return { ...opts }
			},
		},
		[PtzOpticsActionId.IrisUp]: {
			name: 'Iris Up',
			options: [],
			callback: async (event) => {
				instance.sendCommand(IrisUp)
			},
		},
		[PtzOpticsActionId.IrisDown]: {
			name: 'Iris Down',
			options: [],
			callback: async (event) => {
				instance.sendCommand(IrisDown)
			},
		},
		[PtzOpticsActionId.SetIris]: {
			name: 'Set Iris',
			options: [
				{
					type: 'dropdown',
					label: 'Iris setting',
					id: IrisSetOption.id,
					choices: IrisSetOption.choices,
				},
			],
			callback: async (event) => {
				instance.sendCommand(IrisSet, event.options)
			},
		},
		[PtzOpticsActionId.ShutterUp]: {
			name: 'Shutter Up',
			options: [],
			callback: async (event) => {
				instance.sendCommand(ShutterUp)
			},
		},
		[PtzOpticsActionId.ShutterDown]: {
			name: 'Shutter Down',
			options: [],
			callback: async (event) => {
				instance.sendCommand(ShutterDown)
			},
		},
		[PtzOpticsActionId.SetShutter]: {
			name: 'Set Shutter',
			options: [
				{
					type: 'dropdown',
					label: 'Shutter setting',
					id: ShutterSetOption.id,
					choices: ShutterSetOption.choices,
				},
			],
			callback: async (event) => {
				instance.sendCommand(ShutterSet, event.options)
			},
		},
		[PtzOpticsActionId.SetPreset]: {
			name: 'Save Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: PresetSaveOption.id,
					choices: PresetSaveOption.choices,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				instance.sendCommand(PresetSave, event.options)
			},
		},
		[PtzOpticsActionId.RecallPreset]: {
			name: 'Recall Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: PresetRecallOption.id,
					choices: PresetRecallOption.choices,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				instance.sendCommand(PresetRecall, event.options)
			},
		},
		[PtzOpticsActionId.SetPresetDriveSpeed]: {
			name: 'Preset Drive Speed',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: PresetDriveNumberOption.id,
					choices: PresetDriveNumberOption.choices,
					minChoicesForSearch: 1,
				},
				{
					type: 'dropdown',
					label: 'speed setting',
					id: PresetDriveSpeedOption.id,
					choices: PresetDriveSpeedOption.choices,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				instance.sendCommand(PresetDriveSpeed, event.options)
			},
		},
		[PtzOpticsActionId.CameraPowerState]: {
			name: 'Power Camera',
			options: [
				{
					type: 'dropdown',
					label: 'power on/off',
					id: CameraPowerOption.id,
					choices: CameraPowerOption.choices,
				},
			],
			callback: async (event) => {
				instance.sendCommand(CameraPower, event.options)
			},
		},
		[PtzOpticsActionId.OSD]: {
			name: 'OSD Open/Close',
			options: [
				{
					type: 'dropdown',
					label: 'Activate OSD menu',
					id: OnScreenDisplayOption.id,
					choices: [...OnScreenDisplayOption.choices, { id: 'toggle', label: 'toggle' }],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => {
				let shouldToggle
				switch (options[OnScreenDisplayOption.id]) {
					case 'close':
						instance.sendCommand(OnScreenDisplayClose)
						return
					case 'toggle':
						shouldToggle = true
						break
					case 'open':
						const opts = await instance.sendCommand(OnScreenDisplayInquiry)
						if (opts === null) return
						shouldToggle = opts[OnScreenDisplayOption.id] !== 'open'
				}

				if (shouldToggle) {
					instance.sendCommand(OnScreenDisplayToggle)
				}
			},
			learn: async (event) => {
				const opts = await instance.sendCommand(OnScreenDisplayInquiry)
				if (opts === null) return undefined
				return { ...opts }
			},
		},
		[PtzOpticsActionId.OSDNavigate]: {
			name: 'Navigate OSD Camera menu',
			options: [
				{
					type: 'dropdown',
					label: 'Direction',
					id: OnScreenDisplayNavigateOption.id,
					choices: OnScreenDisplayNavigateOption.choices,
					default: 'down',
				},
			],
			callback: async (event) => {
				instance.sendCommand(OnScreenDisplayNavigate, event.options)
			},
		},
		[PtzOpticsActionId.OSDEnter]: {
			name: 'OSD Enter',
			options: [],
			callback: async (event) => {
				instance.sendCommand(OnScreenDisplayEnter)
			},
		},
		[PtzOpticsActionId.OSDBack]: {
			name: 'OSD Back',
			options: [],
			callback: async (event) => {
				instance.sendCommand(OnScreenDisplayBack)
			},
		},
		[PtzOpticsActionId.SelectWhiteBalance]: {
			name: 'White balance',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: WhiteBalanceOption.id,
					choices: WhiteBalanceOption.choices,
				},
			],
			callback: async (event) => {
				instance.sendCommand(WhiteBalance, event.options)
			},
		},
		[PtzOpticsActionId.WhiteBalanceOnePushTrigger]: {
			name: 'White balance one push trigger',
			options: [],
			callback: async (event) => {
				instance.sendCommand(WhiteBalanceOnePushTrigger)
			},
		},
		[PtzOpticsActionId.SelectAutoWhiteBalanceSensitivity]: {
			name: 'Auto white balance sensitivity',
			options: [
				{
					type: 'dropdown',
					label: 'Sensitivity',
					id: AutoWhiteBalanceSensitivityOption.id,
					choices: AutoWhiteBalanceSensitivityOption.choices,
				},
			],
			callback: async (event) => {
				instance.sendCommand(AutoWhiteBalanceSensitivity, event.options)
			},
		},
		[PtzOpticsActionId.AutoTracking]: {
			name: 'Auto Tracking',
			options: [
				{
					type: 'dropdown',
					label: 'Auto Tracking (PTZ Optics G3 model required)',
					id: AutoTrackingOption.id,
					choices: AutoTrackingOption.choices,
				},
			],
			callback: async (event) => {
				instance.sendCommand(AutoTracking, event.options)
			},
		},
		[PtzOpticsActionId.SendCustomCommand]: generateCustomCommandAction(instance),
	}

	return actionDefinitions
}
