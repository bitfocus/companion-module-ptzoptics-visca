import { assertNever } from '@companion-module/base'
import { ModuleDefinedCommand } from '../visca/command.js'
import { ModuleDefinedInquiry } from '../visca/inquiry.js'

export const FocusStop = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x08, 0x00, 0xff])
export const FocusNearStandard = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x08, 0x03, 0xff])
export const FocusFarStandard = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x08, 0x02, 0xff])

export type FocusMode = 'auto' | 'manual'

export const FocusModeInquiry = new ModuleDefinedInquiry([0x81, 0x09, 0x04, 0x38, 0xff], {
	bytes: [0x90, 0x50, 0x00, 0xff],
	params: {
		mode: {
			nibbles: [5],
			convert: (param: number): FocusMode => {
				switch (param) {
					default:
					case 2:
						return 'auto'
					case 3:
						return 'manual'
				}
			},
		},
	},
})

export const FocusMode = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x38, 0x00, 0xff], {
	mode: {
		nibbles: [9],
		convert: (mode: FocusMode): number => {
			switch (mode) {
				// @ts-expect-error intentional fallthrough
				default:
					assertNever(mode) // autofocus seems least risky
				// eslint-disable-next-line no-fallthrough
				case 'auto':
					return 2
				case 'manual':
					return 3
			}
		},
	},
})

export const FocusLock = new ModuleDefinedCommand([0x81, 0x0a, 0x04, 0x68, 0x02, 0xff])
export const FocusUnlock = new ModuleDefinedCommand([0x81, 0x0a, 0x04, 0x68, 0x03, 0xff])
