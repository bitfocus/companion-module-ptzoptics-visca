/**
 * Mock instance like PtzOpticsInstance which can be used for testing what might be sent to the camera
 *
 */
import type { Command } from '../visca/command.js'
import { LogLevel, type CompanionOptionValues } from '@companion-module/base'
import { prettyBytes } from '../visca/utils.js'

export class ActionsMock {
	#last_hex_command = ''
	#variable_map: Map<string, string>
	sendCommand(command: Command, options: CompanionOptionValues = {}): void {
		this.#last_hex_command = prettyBytes(command.toBytes(options))
		return
	}

	constructor() {
		this.#variable_map = new Map<string, string>()
	}

	log(level: LogLevel, message: string): void {
		console.log(level, message)
		return
	}

	/**
	 *
	 * @param incomingString - the stirng that contains the variable to be replaced
	 * @returns string with variables replaced from map
	 */
	parseVariablesInString(incomingString: string): string {
		for (const varEntry of this.#variable_map.entries()) {
			const key = varEntry[0]
			const value = varEntry[1]
			incomingString = incomingString.replaceAll(key, value + '')
		}
		return incomingString
	}

	/**
	 * Resets the last command to ensure that the prior command doesn't affect results
	 * @returns
	 */
	resetLastCommand(): void {
		this.#last_hex_command = ''
		return
	}

	/**
	 *
	 * @returns gets what was the last command that was sent in pretty bytes e.g. '[81 01 04 3F 02 25 FF]'
	 */
	getLastCommand(): string {
		return this.#last_hex_command
	}

	/**
	 *
	 * @param key variable value to be substitutded
	 * @param value what to replace a variable in a string with from parseVariablesInString
	 */
	setVariableInMapEntry(key: string, value: string): void {
		this.#variable_map.set(key, value)
	}

	/**
	 * Clear the variable map
	 */
	clearVariableMap(): void {
		this.#variable_map.clear()
	}
}
