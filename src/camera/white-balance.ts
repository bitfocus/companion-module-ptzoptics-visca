import { assertNever } from '@companion-module/base'
import { ModuleDefinedCommand } from '../visca/command.js'

export type WhiteBalanceMode = 'automatic' | 'indoor' | 'outdoor' | 'onepush' | 'manual'

export const WhiteBalance = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x35, 0x00, 0xff], {
	mode: {
		nibbles: [9],
		convert: (mode: WhiteBalanceMode): number => {
			switch (mode) {
				// @ts-expect-error intentional fallthrough
				default:
					assertNever(mode) // automatic white balance is least risky
				// eslint-disable-next-line no-fallthrough
				case 'automatic':
					return 0x0
				case 'indoor':
					return 0x1
				case 'outdoor':
					return 0x2
				case 'onepush':
					return 0x3
				case 'manual':
					return 0x5
			}
		},
	},
})

export const WhiteBalanceOnePushTrigger = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x10, 0x05, 0xff])

export type AutoWhiteBalanceSensitivityLevel = 'high' | 'normal' | 'low'

export const AutoWhiteBalanceSensitivity = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0xa9, 0x00, 0xff], {
	level: {
		nibbles: [9],
		convert: (level: AutoWhiteBalanceSensitivityLevel): number => {
			switch (level) {
				case 'high':
					return 0
				// @ts-expect-error intentional fallthrough
				default:
					assertNever(level)
				// eslint-disable-next-line no-fallthrough
				case 'normal':
					return 1
				case 'low':
					return 2
			}
		},
	},
})
