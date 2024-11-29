import type { CompanionActionDefinition } from '@companion-module/base'
import type { CustomCommandActionId } from './custom-command.js'
import type { ExposureActionId } from './exposure.js'
import type { FocusActionId } from './focus.js'
import type { MiscellaneousActionId } from './miscellaneous.js'
import type { OSDActionId } from './osd.js'
import type { PanTiltActionId } from './pan-tilt.js'
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
	| CustomCommandActionId
	| ExposureActionId
	| FocusActionId
	| MiscellaneousActionId
	| OSDActionId
	| PanTiltActionId
	| PresetActionId
	| WhiteBalanceActionId
	| ZoomActionId
