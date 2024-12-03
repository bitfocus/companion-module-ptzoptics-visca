import type { CompanionActionContext } from '@companion-module/base'
import { repr } from '../utils/repr.js'

export class MockContext implements CompanionActionContext {
	#variables = new Map<string, string>()

	setVariable(variable: string, value: string): void {
		this.#variables.set(variable, value)
	}

	deleteVariable(variable: string): boolean {
		return this.#variables.delete(variable)
	}

	async parseVariablesInString(text: string): Promise<string> {
		// This is a crude, trimmed-down copy of the algorithm from Companion
		// source code in `companion/lib/Instance/Variable.js`, enough for basic
		// testing purposes.
		const reg = /\$\(((?:[^:$)]+):(?:[^)$]+))\)/

		let result = text

		let matchCount = 0
		let matches
		while ((matches = reg.exec(result)) !== null) {
			if (matchCount++ > 10) {
				throw new Error(`Excessive variable replacements in ${repr(text)}`)
			}

			const [fullId, variable] = matches
			const val = this.#variables.get(variable) ?? '$NA'
			result = result.replace(fullId, () => val)
		}

		return result
	}
}
