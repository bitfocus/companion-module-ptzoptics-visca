import type { CompanionActionDefinition } from '@companion-module/base'
import type { OSDActionId } from './osd.js'
import type { PanTiltActionId } from './pan-tilt.js'
import type { PresetActionId } from './presets.js'

/**
 * The type of action definitions for all actions within the specified action
 * set.
 */
export type ActionDefinitions<ActionSet extends string> = {
	[actionId in ActionSet]: CompanionActionDefinition
}

export enum OtherActionId {
	StartZoomIn = 'zoomI',
	StartZoomOut = 'zoomO',
	StopZoom = 'zoomS',
	StartFocusNearer = 'focusN',
	StartFocusFarther = 'focusF',
	StopFocus = 'focusS',
	SelectFocusMode = 'focusM',
	LockFocus = 'focusL',
	UnlockFocus = 'focusU',
	SelectExposureMode = 'expM',
	IrisUp = 'irisU',
	IrisDown = 'irisD',
	SetIris = 'irisS',
	ShutterUp = 'shutU',
	ShutterDown = 'shutD',
	SetShutter = 'shutS',
	CameraPowerState = 'power',
	SelectWhiteBalance = 'wb',
	WhiteBalanceOnePushTrigger = 'wbOPT',
	SelectAutoWhiteBalanceSensitivity = 'awbS',
	AutoTracking = 'autoTracking',
	SendCustomCommand = 'custom',
}

export type PtzOpticsActionId =
	// Force to separate lines
	| OtherActionId
	// Force to separate lines
	| OSDActionId
	| PanTiltActionId
	| PresetActionId
