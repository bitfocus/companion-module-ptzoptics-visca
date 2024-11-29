import type { ActionDefinitions, PtzOpticsActionId } from './actionid.js'
import type { PtzOpticsInstance } from '../instance.js'
import { osdActions } from './osd.js'
import { otherActions } from './other-actions.js'
import { panTiltActions } from './pan-tilt.js'
import { presetActions } from './presets.js'

export function getActions(instance: PtzOpticsInstance): ActionDefinitions<PtzOpticsActionId> {
	return {
		...osdActions(instance),
		...panTiltActions(instance),
		...presetActions(instance),
		...otherActions(instance),
	}
}
