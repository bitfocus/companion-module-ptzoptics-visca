import type { ActionDefinitions, PtzOpticsActionId } from './actionid.js'
import { customCommandActions } from './custom-command.js'
import { exposureActions } from './exposure.js'
import { focusActions } from './focus.js'
import type { PtzOpticsInstance } from '../instance.js'
import { miscellaneousActions } from './miscellaneous.js'
import { osdActions } from './osd.js'
import { panTiltActions } from './pan-tilt.js'
import { presetActions } from './presets.js'
import { whiteBalanceActions } from './white-balance.js'
import { zoomActions } from './zoom.js'

export function getActions(instance: PtzOpticsInstance): ActionDefinitions<PtzOpticsActionId> {
	return {
		...customCommandActions(instance),
		...exposureActions(instance),
		...focusActions(instance),
		...miscellaneousActions(instance),
		...osdActions(instance),
		...panTiltActions(instance),
		...presetActions(instance),
		...whiteBalanceActions(instance),
		...zoomActions(instance),
		...miscellaneousActions(instance),
	}
}
