import type { ActionDefinitions, PtzOpticsActionId } from './actionid.js'
import { autoTrackingActions } from './auto-tracking.js'
import { customCommandActions } from './custom-command.js'
import { exposureActions } from './exposure.js'
import { focusActions } from './focus.js'
import type { PtzOpticsInstance } from '../instance.js'
import { osdActions } from './osd.js'
import { panTiltActions } from './pan-tilt.js'
import { powerActions } from './power.js'
import { presetActions } from './presets.js'
import { whiteBalanceActions } from './white-balance.js'
import { zoomActions } from './zoom.js'

export function getActions(instance: PtzOpticsInstance): ActionDefinitions<PtzOpticsActionId> {
	return {
		...autoTrackingActions(instance),
		...customCommandActions(instance),
		...exposureActions(instance),
		...focusActions(instance),
		...osdActions(instance),
		...panTiltActions(instance),
		...powerActions(instance),
		...presetActions(instance),
		...whiteBalanceActions(instance),
		...zoomActions(instance),
	}
}
