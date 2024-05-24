import { describe, expect, test } from '@jest/globals'
import { parsePresetVariableOption } from './preset-by-number.js'
import type { CompanionOptionValues } from '@companion-module/base'
import { PresetRecall } from './camera/commands.js'
import { MockContext } from './__tests__/mock-context.js'
import type { Command } from './visca/command.js'

function optionsWithPresetOption(text: string): CompanionOptionValues {
	return { val: text }
}

function expectResolvesToCommandBytes(
	result: string | CompanionOptionValues,
	command: Command,
	expectedBytes: readonly number[]
): void {
	if (typeof result === 'string') {
		throw new TypeError('Result should not have been an error, instead got: ' + result)
	}

	const commandBytes = command.toBytes(result)
	expect(commandBytes.length).toBe(expectedBytes.length)
	for (let i = 0; i < commandBytes.length; i++) {
		expect(commandBytes[i]).toBe(expectedBytes[i])
	}
}

function expectIsErrorString(result: string | CompanionOptionValues): void {
	if (typeof result !== 'string') {
		throw new TypeError('Result should have been an error')
	}
}

describe('test recall preset values', () => {
	test('User enters "37" as the preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetOption('37')
		const result = await parsePresetVariableOption(options, context)
		expectResolvesToCommandBytes(result, PresetRecall, [0x81, 0x01, 0x04, 0x3f, 0x02, 0x25, 0xff])
	})

	test('User enters "foo" (not a number at all) as the preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetOption('foo')
		const result = await parsePresetVariableOption(options, context)
		expectIsErrorString(result)
	})

	test('User enters an invalid preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetOption('99')
		const result = await parsePresetVariableOption(options, context)
		expectIsErrorString(result)
	})

	test('User enters a variable that resolves to dec 254', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '254')
		const options = optionsWithPresetOption('$(internal:foo)')
		const result = await parsePresetVariableOption(options, context)
		expectResolvesToCommandBytes(result, PresetRecall, [0x81, 0x01, 0x04, 0x3f, 0x02, 0xfe, 0xff])
	})

	test('User enters a variable that resolves to an invalid preset', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '255')
		const options = optionsWithPresetOption('$(internal:foo)')
		const result = await parsePresetVariableOption(options, context)
		expectIsErrorString(result)
	})
})
