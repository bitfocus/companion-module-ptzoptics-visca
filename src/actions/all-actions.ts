import type { ActionDefinitions, PtzOpticsActionId } from './actionid.js'
import type { PtzOpticsInstance } from '../instance.js'
import { otherActions } from './actions.js'
import { presetActions } from './presets.js'

export function getActions(instance: PtzOpticsInstance): ActionDefinitions<PtzOpticsActionId> {
	return {
		...presetActions(instance),
		...otherActions(instance),
	}
}
