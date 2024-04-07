import { CompanionActionInfo } from '@companion-module/base'
import { describe, expect, test } from '@jest/globals'
import {
	addCommandParameterOptionsToCustomCommandOptions,
	isCustomCommandMissingCommandParameterOptions,
} from './custom-command-action.js'

function makeCustomActionInfo(includeParameters: boolean): CompanionActionInfo {
	const cai: CompanionActionInfo = {
		id: 'abcOdOefghiOFjBkGHlJm',
		controlId: '1/0/0',
		actionId: 'custom',
		options: {
			custom: '81 01 06 06 03 FF',
		},
	}

	if (includeParameters) {
		cai.options.command_parameters = ''
		cai.options.parameter0 = ''
		cai.options.parameter1 = ''
		cai.options.parameter2 = ''
		cai.options.parameter3 = ''
	}

	return cai
}
describe('custom command upgrade to support parameters', () => {
	test('old-school custom command testing and upgrading', () => {
		const needsUpgrade = makeCustomActionInfo(false)

		expect(isCustomCommandMissingCommandParameterOptions(needsUpgrade)).toBe(true)
		expect('command_parameters' in needsUpgrade.options).toBe(false)
		expect('parameter0' in needsUpgrade.options).toBe(false)
		expect('parameter1' in needsUpgrade.options).toBe(false)
		expect('parameter2' in needsUpgrade.options).toBe(false)
		expect('parameter3' in needsUpgrade.options).toBe(false)

		addCommandParameterOptionsToCustomCommandOptions(needsUpgrade.options)

		expect(isCustomCommandMissingCommandParameterOptions(needsUpgrade)).toBe(false)
		expect('command_parameters' in needsUpgrade.options).toBe(true)
		expect(needsUpgrade.options['parameter0']).toBe('')
		expect(needsUpgrade.options['parameter1']).toBe('')
		expect(needsUpgrade.options['parameter2']).toBe('')
		expect(needsUpgrade.options['parameter3']).toBe('')

		const newStyle = makeCustomActionInfo(true)
		expect(isCustomCommandMissingCommandParameterOptions(newStyle)).toBe(false)
	})
})
