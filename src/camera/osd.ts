import { assertNever } from '@companion-module/base'
import { ModuleDefinedCommand } from '../visca/newcommand.js'
import { ModuleDefinedInquiry } from '../visca/inquiry.js'

export type OnScreenDisplayMenuState = 'open' | 'close'

export const OnScreenDisplayInquiry = new ModuleDefinedInquiry([0x81, 0x09, 0x06, 0x06, 0xff], {
	bytes: [0x90, 0x50, 0x00, 0xff],
	params: {
		state: {
			nibbles: [5],
			convert: (param: number): OnScreenDisplayMenuState => {
				switch (param) {
					case 0x2:
						return 'open'
					default:
					case 0x3:
						return 'close'
				}
			},
		},
	},
})

export const OnScreenDisplayToggle = new ModuleDefinedCommand([0x81, 0x01, 0x04, 0x3f, 0x02, 0x5f, 0xff])
export const OnScreenDisplayClose = new ModuleDefinedCommand([0x81, 0x01, 0x06, 0x06, 0x03, 0xff])

export type OSDNavigateDirection = 'up' | 'right' | 'down' | 'left'

export const OnScreenDisplayNavigate = new ModuleDefinedCommand(
	[0x81, 0x01, 0x06, 0x01, 0x0e, 0x0e, 0x00, 0x00, 0xff],
	{
		direction: {
			nibbles: [13, 15],
			convert: (direction: OSDNavigateDirection): number => {
				switch (direction) {
					case 'up':
						return 0x31
					case 'right':
						return 0x23
					// @ts-expect-error intentional fallthrough
					default:
						assertNever(direction)
					// eslint-disable-next-line no-fallthrough
					case 'down':
						return 0x32
					case 'left':
						return 0x13
				}
			},
		},
	},
)

export const OnScreenDisplayEnter = new ModuleDefinedCommand([0x81, 0x01, 0x06, 0x06, 0x05, 0xff])
export const OnScreenDisplayBack = new ModuleDefinedCommand([0x81, 0x01, 0x06, 0x06, 0x04, 0xff])
