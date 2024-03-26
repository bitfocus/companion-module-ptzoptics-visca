import type { InstanceStatus, LogLevel } from '@companion-module/base'

export type MockInstance = {
	log: (this: MockInstance, level: LogLevel, msg: string) => void
	updateStatus: (this: MockInstance, status: InstanceStatus) => void
}
