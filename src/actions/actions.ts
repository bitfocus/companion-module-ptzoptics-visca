import type { ActionDefinitions, PtzOpticsActionId } from './actionid.js'
import { focusActions } from './focus.js'
import type { PtzOpticsInstance } from '../instance.js'
import { osdActions } from './osd.js'
import { otherActions } from './other-actions.js'
import { panTiltActions } from './pan-tilt.js'
import { presetActions } from './presets.js'
import { zoomActions } from './zoom.js'

export function getActions(instance: PtzOpticsInstance): ActionDefinitions<PtzOpticsActionId> {
	return {
		...focusActions(instance),
		...osdActions(instance),
		...panTiltActions(instance),
		...presetActions(instance),
		...zoomActions(instance),
		...otherActions(instance),
	}
}
