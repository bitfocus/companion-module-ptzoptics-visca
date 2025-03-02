import { assertNever } from '@companion-module/base'
import { ModuleDefinedCommand } from '../visca/command.js'

export type AutoTrackingState = 'on' | 'off'

// PTZOptics G3 VISCA over IP Commands, 10/27/2023:
// 81 0A 11 54 0p FF, p: 0x2=On, 0x3=Off
export const AutoTracking = new ModuleDefinedCommand([0x81, 0x0a, 0x11, 0x54, 0x00, 0xff], {
	state: {
		nibbles: [9],
		convert: (state: AutoTrackingState): number => {
			switch (state) {
				case 'on':
					return 0x2
				// @ts-expect-error intentional fallthrough
				default:
					assertNever(state) // turn off abrupt movements on bad state
				// eslint-disable-next-line no-fallthrough
				case 'off':
					return 0x3
			}
		},
	},
})
