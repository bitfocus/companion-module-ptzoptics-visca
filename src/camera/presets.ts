import { ModuleDefinedCommand } from '../visca/command.js'

/**
 * Determine whether a number is a valid preset.
 *
 * The overall preset range is `[0, 256)`, but presets `[90, 100)` and `255` are
 * [reserved by PTZOptics](https://community.ptzoptics.com/s/article/PTZOptics-Preset-Commands---Reserved-Presets-and-Special-Functions)
 * for various purposes and so are considered invalid.
 */
export function isValidPreset(n: number): boolean {
	return (0 <= n && n < 90) || (99 < n && n < 255)
}

export const PresetSave = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x3f, 0x01, 0x00, 0xff], {
	preset: {
		nibbles: [10, 11],
	},
})

export const PresetRecall = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x3f, 0x02, 0x00, 0xff], {
	preset: {
		nibbles: [10, 11],
	},
})

export const PresetDriveSpeed = new ModuleDefinedCommand([0x81, 0x01, 0x06, 0x01, 0x00, 0x00, 0xff], {
	preset: {
		nibbles: [8, 9],
	},
	speed: {
		nibbles: [10, 11],
	},
})
