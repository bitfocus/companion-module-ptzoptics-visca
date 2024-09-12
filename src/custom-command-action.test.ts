import { type CompanionActionInfo } from '@companion-module/base'
import { describe, expect, test } from '@jest/globals'
import {
	addCommandParameterOptionsToCustomCommandOptions,
	computeCustomCommandAndOptions,
	isCustomCommandMissingCommandParameterOptions,
} from './custom-command-action.js'
import { MockContext } from './__tests__/mock-context.js'

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

describe('custom command ultimate bytes sent', () => {
	test('no parameters', async () => {
		const context = new MockContext()

		const actionOptions = {
			custom: '81 0A 11 54 00 FF',
			command_parameters: '',
		}

		const { command, options } = await computeCustomCommandAndOptions(actionOptions, context)
		expect(command.toBytes(options)).toStrictEqual([0x81, 0x0a, 0x11, 0x54, 0x00, 0xff])
	})

	test('one parameter, no variables', async () => {
		const context = new MockContext()

		const actionOptions = {
			custom: '81 0A 11 54 00 FF',
			command_parameters: '9',
			parameter0: '5',
		}

		const { command, options } = await computeCustomCommandAndOptions(actionOptions, context)
		expect(command.toBytes(options)).toStrictEqual([0x81, 0x0a, 0x11, 0x54, 0x05, 0xff])
	})

	test('one parameter, nonexistent variable', async () => {
		const context = new MockContext()

		const actionOptions = {
			custom: '81 0A 11 54 00 FF',
			command_parameters: '9',
			parameter0: '$(internal:custom_doesnt_exist)',
		}

		const { command, options } = await computeCustomCommandAndOptions(actionOptions, context)
		expect(command.toBytes(options)).toStrictEqual([0x81, 0x0a, 0x11, 0x54, 0x00, 0xff])
	})

	test('one parameter, existing variable', async () => {
		const context = new MockContext()
		context.setVariable('internal:custom_does_exist', '8')

		const actionOptions = {
			custom: '81 0A 11 54 00 FF',
			command_parameters: '9',
			parameter0: '$(internal:custom_does_exist)',
		}

		const { command, options } = await computeCustomCommandAndOptions(actionOptions, context)
		expect(command.toBytes(options)).toStrictEqual([0x81, 0x0a, 0x11, 0x54, 0x08, 0xff])
	})

	test('one parameter, two variables', async () => {
		const context = new MockContext()
		context.setVariable('internal:custom_one', '3')
		context.setVariable('internal:custom_two', '1')

		const actionOptions = {
			custom: '81 0A 11 54 00 FF',
			command_parameters: '9',
			parameter0: '$(internal:custom_two)$(internal:custom_one)',
		}

		const { command, options } = await computeCustomCommandAndOptions(actionOptions, context)
		expect(command.toBytes(options)).toStrictEqual([0x81, 0x0a, 0x11, 0x54, 0x0d, 0xff])
	})

	test('two parameters, two variables', async () => {
		const context = new MockContext()
		context.setVariable('internal:custom_one', '2')
		context.setVariable('internal:custom_two', '1')

		const actionOptions = {
			custom: '81 0A 11 54 00 FF',
			command_parameters: '2; 9',
			parameter0: '7',
			parameter1: '$(internal:custom_two)$(internal:custom_one)',
		}

		const { command, options } = await computeCustomCommandAndOptions(actionOptions, context)
		expect(command.toBytes(options)).toStrictEqual([0x81, 0x7a, 0x11, 0x54, 0x0c, 0xff])
	})
})
