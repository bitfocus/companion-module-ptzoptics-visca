import type { CompanionPresetDefinitions } from '@companion-module/base'
import { autoTrackingPresets } from './auto-tracking.js'
import { cameraPresets } from './camera-presets.js'
import { exposurePresets } from './exposure.js'
import { lensPresets } from './lens.js'
import { osdPresets } from './osd.js'
import { panTiltPresets } from './pan-tilt.js'
import { whiteBalancePresets } from './white-balance.js'

export function getPresets(): CompanionPresetDefinitions {
	return {
		...panTiltPresets(),
		...lensPresets(),
		...exposurePresets(),
		...whiteBalancePresets(),
		...autoTrackingPresets(),
		...osdPresets(),
		...cameraPresets(),
	}
}
