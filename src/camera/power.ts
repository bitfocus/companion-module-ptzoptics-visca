import type { Expect, IsNever } from 'type-testing'
import { ModuleDefinedCommand } from '../visca/command.js'

export const CameraPowerState = {
	Standby: 'standby',
	On: 'on',
} as const

export type CameraPowerState = (typeof CameraPowerState)[keyof typeof CameraPowerState]

export const CameraPower = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x00, 0x00, 0xff], {
	state: {
		nibbles: [9],
		convert: (state: CameraPowerState): number => {
			switch (state) {
				case 'standby':
					return 0x3
				// @ts-expect-error intentional fallthrough
				default:
					type assert_StateIsNever = Expect<IsNever<typeof state>>
				// eslint-disable-next-line no-fallthrough
				case 'on':
					return 0x2
			}
		},
	},
})
