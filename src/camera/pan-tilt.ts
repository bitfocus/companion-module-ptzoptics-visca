import type { PtzOpticsInstance } from '../instance.js'
import { ModuleDefinedCommand } from '../visca/command.js'
import { ModuleDefinedInquiry } from '../visca/inquiry.js'

export const PanTiltPositionInquiry = new ModuleDefinedInquiry([0x81, 0x09, 0x06, 0x12, 0xff], {
	bytes: [0x90, 0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff],
	params: {
		panPosition: {
			nibbles: [5, 7, 9, 11],
		},
		tiltPosition: {
			nibbles: [13, 15, 17, 19],
		},
	},
})

export const MoveToAbsolutePanTilt = new ModuleDefinedCommand(
	[0x81, 0x01, 0x06, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff],
	{
		panSpeed: {
			nibbles: [8, 9],
		},
		tiltSpeed: {
			nibbles: [10, 11],
		},
		panPosition: {
			nibbles: [13, 15, 17, 19],
		},
		tiltPosition: {
			nibbles: [21, 23, 25, 27],
		},
	},
)

export enum PanTiltAction {
	Up,
	Down,
	Left,
	Right,
	UpLeft,
	UpRight,
	DownLeft,
	DownRight,
	Stop,
}

export const PanTiltDirection: Record<PanTiltAction, readonly [number, number]> = {
	[PanTiltAction.Up]: [0x03, 0x01],
	[PanTiltAction.Down]: [0x03, 0x02],
	[PanTiltAction.Left]: [0x01, 0x03],
	[PanTiltAction.Right]: [0x02, 0x03],
	[PanTiltAction.UpLeft]: [0x01, 0x01],
	[PanTiltAction.UpRight]: [0x02, 0x01],
	[PanTiltAction.DownLeft]: [0x01, 0x02],
	[PanTiltAction.DownRight]: [0x02, 0x02],
	[PanTiltAction.Stop]: [0x03, 0x03],
}

export function sendPanTiltCommand(
	instance: PtzOpticsInstance,
	direction: readonly [number, number],
	panSpeed: number,
	tiltSpeed: number,
): void {
	const command = new ModuleDefinedCommand([0x81, 0x01, 0x06, 0x01, panSpeed, tiltSpeed, ...direction, 0xff])
	instance.sendCommand(command)
}

export const PanTiltHome = new ModuleDefinedCommand([0x81, 0x01, 0x06, 0x04, 0xff])
