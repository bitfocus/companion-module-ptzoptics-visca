import type { CompanionActionDefinition } from '@companion-module/base'
import type { AutoTrackingActionId } from './auto-tracking.js'
import type { CustomCommandActionId } from './custom-command.js'
import type { ExposureActionId } from './exposure.js'
import type { FocusActionId } from './focus.js'
import type { OSDActionId } from './osd.js'
import type { PanTiltActionId } from './pan-tilt.js'
import type { PowerActionId } from './power.js'
import type { PresetActionId } from './presets.js'
import type { WhiteBalanceActionId } from './white-balance.js'
import type { ZoomActionId } from './zoom.js'

/**
 * A helper type to apply to a complete `CompanionActionDefinitions` for an
 * action ID enum.
 */
export type ActionDefinitions<ActionId extends string> = Record<ActionId, CompanionActionDefinition>

/** All module action IDs. */
export type PtzOpticsActionId =
	| AutoTrackingActionId
	| CustomCommandActionId
	| ExposureActionId
	| FocusActionId
	| OSDActionId
	| PanTiltActionId
	| PowerActionId
	| PresetActionId
	| WhiteBalanceActionId
	| ZoomActionId
