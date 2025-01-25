import type { PtzOpticsInstance } from '../instance.js'
import { ModuleDefinedCommand } from '../visca/newcommand.js'

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
