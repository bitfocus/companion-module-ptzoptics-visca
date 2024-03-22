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

export const CustomCommandActionId = 'custom'

export function getActions(instance) {
	function createPanTiltCallback(direction) {
		return async (event) => {
			const { panSpeed, tiltSpeed } = instance.panTiltSpeed()
			sendPanTiltCommand(instance, direction, panSpeed, tiltSpeed)
		}
	}

	const actionDefinitions = {
		left: {
			name: 'Pan Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.Left),
		},
		right: {
			name: 'Pan Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.Right),
		},
		up: {
			name: 'Tilt Up',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.Up),
		},
		down: {
			name: 'Tilt Down',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.Down),
		},
		upLeft: {
			name: 'Up Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.UpLeft),
		},
		upRight: {
			name: 'Up Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.UpRight),
		},
		downLeft: {
			name: 'Down Left',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.DownLeft),
		},
		downRight: {
			name: 'Down Right',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.DownRight),
		},
		stop: {
			name: 'P/T Stop',
			options: [],
			callback: createPanTiltCallback(PanTiltDirection.Stop),
		},
		home: {
			name: 'P/T Home',
			options: [],
			callback: async (event) => {
				instance.sendCommand(PanTiltHome)
			},
		},
		ptSpeedS: {
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
		ptSpeedU: {
			name: 'P/T Speed Up',
			options: [],
			callback: async (event) => {
				instance.increasePanTiltSpeed()
			},
		},
		ptSpeedD: {
			name: 'P/T Speed Down',
			options: [],
			callback: async (event) => {
				instance.decreasePanTiltSpeed()
			},
		},
		zoomI: {
			name: 'Zoom In',
			options: [],
			callback: async (event) => {
				instance.sendCommand(ZoomIn)
			},
		},
		zoomO: {
			name: 'Zoom Out',
			options: [],
			callback: async (event) => {
				instance.sendCommand(ZoomOut, event.options)
			},
		},
		zoomS: {
			name: 'Zoom Stop',
			options: [],
			callback: async (event) => {
				instance.sendCommand(ZoomStop)
			},
		},
		focusN: {
			name: 'Focus Near',
			options: [],
			callback: async (event) => {
				instance.sendCommand(FocusNearStandard)
			},
		},
		focusF: {
			name: 'Focus Far',
			options: [],
			callback: async (event) => {
				instance.sendCommand(FocusFarStandard)
			},
		},
		focusS: {
			name: 'Focus Stop',
			options: [],
			callback: async (event) => {
				instance.sendCommand(FocusStop)
			},
		},
		focusM: {
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
		focusL: {
			name: 'Focus Lock',
			options: [],
			callback: async (event) => {
				instance.sendCommand(FocusLock)
			},
		},
		focusU: {
			name: 'Focus Unlock',
			options: [],
			callback: async (event) => {
				instance.sendCommand(FocusUnlock)
			},
		},
		expM: {
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
		irisU: {
			name: 'Iris Up',
			options: [],
			callback: async (event) => {
				instance.sendCommand(IrisUp)
			},
		},
		irisD: {
			name: 'Iris Down',
			options: [],
			callback: async (event) => {
				instance.sendCommand(IrisDown)
			},
		},
		irisS: {
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
		shutU: {
			name: 'Shutter Up',
			options: [],
			callback: async (event) => {
				instance.sendCommand(ShutterUp)
			},
		},
		shutD: {
			name: 'Shutter Down',
			options: [],
			callback: async (event) => {
				instance.sendCommand(ShutterDown)
			},
		},
		shutS: {
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
		savePset: {
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
		recallPset: {
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
		speedPset: {
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
		power: {
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
		onScreenDisplay: {
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
		onScreenDisplayNavigate: {
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
		onScreenDisplayEnter: {
			name: 'OSD Enter',
			options: [],
			callback: async (event) => {
				instance.sendCommand(OnScreenDisplayEnter)
			},
		},
		onScreenDisplayBack: {
			name: 'OSD Back',
			options: [],
			callback: async (event) => {
				instance.sendCommand(OnScreenDisplayBack)
			},
		},
		wb: {
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
		wbOPT: {
			name: 'White balance one push trigger',
			options: [],
			callback: async (event) => {
				instance.sendCommand(WhiteBalanceOnePushTrigger)
			},
		},
		awbS: {
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
		autoTracking: {
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
		[CustomCommandActionId]: generateCustomCommandAction(instance),
	}

	return actionDefinitions
}
