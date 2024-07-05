import { describe, expect, test } from '@jest/globals'
import { parsePresetVariableOption } from '../preset-by-number.js'
import { CompanionOptionValues } from '@companion-module/base'
import { PresetRecall } from '../camera/commands.js'
import { prettyBytes } from '../visca/utils.js'
import { MockContext } from './mock-context.js'
import type { MatcherFunction } from 'expect'
import { Command } from '../visca/command.js'

function optionsWithPresetOption(text: string): CompanionOptionValues {
	return { val: text }
}

/**
 * Custom jest matcher to check that options are not a string and that the command bytes match
 * @param actual
 * @param command
 * @param expected_bytes
 * @returns
 */
const toBeExpectedCommandBytes: MatcherFunction<[command: Command, expected_bytes: string]> = function (
	actual,
	command,
	expected_bytes
) {
	if (typeof actual === 'string') {
		throw new TypeError('Input showuld be of type CompanionOptionValues not string')
	}

	const commandBytes = command.toBytes(actual as CompanionOptionValues)
	const pass = prettyBytes(commandBytes) === expected_bytes

	return {
		message: () =>
			`expected ${this.utils.printReceived(prettyBytes(commandBytes))} ${
				pass ? 'not ' : ''
			}to match\nreceived ${this.utils.printExpected(expected_bytes)}`,
		pass: pass,
	}
}

/**
 * Custom jest matcher to ensure that options is a string and has appropriate error
 * @param actual
 * @returns
 */
const toBeErrorString: MatcherFunction<[]> = function (actual) {
	let pass = false
	if (typeof actual === 'string') {
		pass = actual.includes('Invalid recall preset value of')
	}

	return {
		message: () => `expected result ${pass ? 'not ' : ''}to be an error string, received: ${actual}`,
		pass: pass,
	}
}

declare module 'expect' {
	interface Matchers<R> {
		toBeExpectedCommandBytes(command: Command, expected_bytes: string): R
		toBeErrorString(): R
	}
	interface AsymmetricMatchers {
		toBeExpectedCommandBytes(command: Command, expected_bytes: string): void
		toBeErrorString(): void
	}
}

expect.extend({
	toBeExpectedCommandBytes,
	toBeErrorString,
})

describe('test recall preset values', () => {
	const command_to_test = PresetRecall
	test('User enters "37" as the preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetOption('37')
		const result = await parsePresetVariableOption(options, context)
		expect(result).not.toBeErrorString()
		expect(result).toBeExpectedCommandBytes(command_to_test, '[81 01 04 3F 02 25 FF]')
	})

	test('User enters "foo" (not a number at all) as the preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetOption('foo')
		const result = await parsePresetVariableOption(options, context)
		expect(result).toBeErrorString()
	})

	test('User enters an invalid preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetOption('99')
		const result = await parsePresetVariableOption(options, context)
		expect(result).toBeErrorString()
	})

	test('User enters a variable that resolves to dec 254', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '254')
		const options = optionsWithPresetOption('$(internal:foo)')
		const result = await parsePresetVariableOption(options, context)
		expect(result).not.toBeErrorString()
		expect(result).toBeExpectedCommandBytes(command_to_test, '[81 01 04 3F 02 FE FF]')
	})

	test('User enters a variable that resolves to an invalid preset', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '255')
		const options = optionsWithPresetOption('$(internal:foo)')
		const result = await parsePresetVariableOption(options, context)
		expect(result).toBeErrorString()
	})
})
