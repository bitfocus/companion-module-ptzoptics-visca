import type { ActionDefinitions, PtzOpticsActionId } from './actionid.js'
import { customCommandActions } from './custom-command.js'
import { focusActions } from './focus.js'
import type { PtzOpticsInstance } from '../instance.js'
import { osdActions } from './osd.js'
import { otherActions } from './other-actions.js'
import { panTiltActions } from './pan-tilt.js'
import { presetActions } from './presets.js'
import { whiteBalanceActions } from './white-balance.js'
import { zoomActions } from './zoom.js'

export function getActions(instance: PtzOpticsInstance): ActionDefinitions<PtzOpticsActionId> {
	return {
		...customCommandActions(instance),
		...focusActions(instance),
		...osdActions(instance),
		...panTiltActions(instance),
		...presetActions(instance),
		...whiteBalanceActions(instance),
		...zoomActions(instance),
		...otherActions(instance),
	}
}
