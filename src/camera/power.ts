import { assertNever } from '@companion-module/base'
import { ModuleDefinedCommand } from '../visca/command.js'

export type CameraPowerState = 'standby' | 'on'

export const CameraPower = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x00, 0x00, 0xff], {
	state: {
		nibbles: [9],
		convert: (state: CameraPowerState): number => {
			switch (state) {
				case 'standby':
					return 0x3
				// @ts-expect-error intentional fallthrough
				default:
					assertNever(state)
				// eslint-disable-next-line no-fallthrough
				case 'on':
					return 0x2
			}
		},
	},
})
