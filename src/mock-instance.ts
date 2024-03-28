import type { CompanionOptionValues, InstanceStatus, LogLevel } from '@companion-module/base'
import type { Command } from './visca/command.js'

export type MockInstance = {
	log: (this: MockInstance, level: LogLevel, msg: string) => void
	updateStatus: (this: MockInstance, status: InstanceStatus) => void
	sendCommand: (
		this: MockInstance,
		command: Command,
		options?: CompanionOptionValues | null
	) => Promise<CompanionOptionValues | null>
	panTiltSpeed: (this: MockInstance) => { panSpeed: number; tiltSpeed: number }
	increasePanTiltSpeed: (this: MockInstance) => void
	decreasePanTiltSpeed: (this: MockInstance) => void
	setPanTiltSpeed: (this: MockInstance, speed: number) => void
}
