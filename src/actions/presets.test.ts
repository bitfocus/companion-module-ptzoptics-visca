import type { CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import { describe, expect, test } from '@jest/globals'
import { PresetRecall, PresetSave } from '../camera/commands.js'
import { PresetRecallDefault, PresetSetDefault, PresetValueOptionId, twoDigitHex } from '../camera/options.js'
import {
	parsePresetVariableOption,
	PresetActionId,
	PresetUseVariablesOptionId,
	PresetVariableOptionId,
	tryUpdateRecallSetPresetActions,
} from './presets.js'
import { MockContext } from '../__tests__/mock-context.js'
import type { Bytes } from '../utils/byte.js'
import { repr } from '../utils/repr.js'
import type { Command } from '../visca/command.js'

function optionsWithPresetOption(textinput: string, preset: number): CompanionOptionValues {
	return {
		[PresetUseVariablesOptionId]: true,
		[PresetVariableOptionId]: textinput,
		[PresetValueOptionId]: twoDigitHex(preset),
	}
}

function expectResolvesToCommandBytes(
	result: string | CompanionOptionValues,
	command: Command,
	expectedBytes: Bytes,
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
		throw new TypeError(`Result should have been an error: ${repr(result)}`)
	}
}

describe('test invalid preset input', () => {
	test('User enters "foo" (not a number at all) as the preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetOption('foo', PresetSetDefault)
		const result = await parsePresetVariableOption(options, context)
		expectIsErrorString(result)
	})

	test('User enters an invalid preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetOption('99', PresetRecallDefault)
		const result = await parsePresetVariableOption(options, context)
		expectIsErrorString(result)
	})

	test('User enters a variable that resolves to an invalid preset', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '255')
		const options = optionsWithPresetOption('$(internal:foo)', 250)
		const result = await parsePresetVariableOption(options, context)
		expectIsErrorString(result)
	})
})

describe('test recall preset values', () => {
	test('User enters "37" as the preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetOption('37', 25)
		const result = await parsePresetVariableOption(options, context)
		expectResolvesToCommandBytes(result, PresetRecall, [0x81, 0x01, 0x04, 0x3f, 0x02, 0x25, 0xff])
	})

	test('User enters a variable that resolves to dec 254', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '254')
		const options = optionsWithPresetOption('$(internal:foo)', 16)
		const result = await parsePresetVariableOption(options, context)
		expectResolvesToCommandBytes(result, PresetRecall, [0x81, 0x01, 0x04, 0x3f, 0x02, 0xfe, 0xff])
	})
})

describe('test set preset values', () => {
	test('User enters "37" as the preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetOption('37', 82)
		const result = await parsePresetVariableOption(options, context)
		expectResolvesToCommandBytes(result, PresetSave, [0x81, 0x01, 0x04, 0x3f, 0x01, 0x25, 0xff])
	})

	test('User enters a variable that resolves to dec 254', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '254')
		const options = optionsWithPresetOption('$(internal:foo)', 77)
		const result = await parsePresetVariableOption(options, context)
		expectResolvesToCommandBytes(result, PresetSave, [0x81, 0x01, 0x04, 0x3f, 0x01, 0xfe, 0xff])
	})
})

describe('preset upgrading of non-preset action', () => {
	describe('test preset upgrading of non-preset action', () => {
		test('non-upgradable action', async () => {
			const action: CompanionMigrationAction = {
				actionId: 'foobar',
				id: 'ohai',
				controlId: 'x',
				options: {
					[PresetValueOptionId]: '123',
				},
			}

			expect(tryUpdateRecallSetPresetActions(action)).toBe(false)

			const { actionId, options } = action
			expect(actionId).toBe('foobar')
			expect(options[PresetValueOptionId]).toBe('123')
		})
	})
})

describe('obsolete preset recall upgrades', () => {
	test('upgradable with constant preset', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'recallPset',
			id: 'kthx',
			controlId: 'x',
			options: {
				[PresetValueOptionId]: twoDigitHex(66), // '42'
			},
		}

		expect(tryUpdateRecallSetPresetActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(PresetActionId.RecallPset)
		expect(options[PresetUseVariablesOptionId]).toBe(false)
		expect(options[PresetValueOptionId]).toBe('42')
		expect(options[PresetVariableOptionId]).toBe(`66`)
	})

	test('upgradable with variable preset containing number', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'recallPsetFromVar',
			id: 'kthx',
			controlId: 'y',
			options: {
				[PresetValueOptionId]: '42',
			},
		}

		expect(tryUpdateRecallSetPresetActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(PresetActionId.RecallPset)
		expect(options[PresetUseVariablesOptionId]).toBe(true)
		expect(options[PresetValueOptionId]).toBe(twoDigitHex(42))
		expect(options[PresetVariableOptionId]).toBe('42')
	})

	test('upgradable with variable preset containing variable', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'recallPsetFromVar',
			id: 'kthx',
			controlId: 'y',
			options: {
				[PresetValueOptionId]: '1$(internal:custom_var)',
			},
		}

		expect(tryUpdateRecallSetPresetActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(PresetActionId.RecallPset)
		expect(options[PresetUseVariablesOptionId]).toBe(true)
		expect(options[PresetValueOptionId]).toBe(twoDigitHex(PresetRecallDefault))
		expect(options[PresetVariableOptionId]).toBe('1$(internal:custom_var)')
	})
})

describe('obsolete preset save upgrades', () => {
	test('upgradable with constant preset', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'savePset',
			id: 'kthx',
			controlId: 'z',
			options: {
				[PresetValueOptionId]: twoDigitHex(66), // '42'
			},
		}

		expect(tryUpdateRecallSetPresetActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(PresetActionId.SavePset)
		expect(options[PresetUseVariablesOptionId]).toBe(false)
		expect(options[PresetValueOptionId]).toBe('42')
		expect(options[PresetVariableOptionId]).toBe('66')
	})

	test('upgradable with variable preset containing number', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'savePsetFromVar',
			id: 'kthx',
			controlId: 'w',
			options: {
				[PresetValueOptionId]: '42',
			},
		}

		expect(tryUpdateRecallSetPresetActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(PresetActionId.SavePset)
		expect(options[PresetUseVariablesOptionId]).toBe(true)
		expect(options[PresetValueOptionId]).toBe(twoDigitHex(42))
		expect(options[PresetVariableOptionId]).toBe('42')
	})

	test('upgradable with variable preset containing variable', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'savePsetFromVar',
			id: 'kthx',
			controlId: 'w',
			options: {
				[PresetValueOptionId]: '1$(internal:custom_var)',
			},
		}

		expect(tryUpdateRecallSetPresetActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(PresetActionId.SavePset)
		expect(options[PresetUseVariablesOptionId]).toBe(true)
		expect(options[PresetValueOptionId]).toBe(twoDigitHex(PresetSetDefault))
		expect(options[PresetVariableOptionId]).toBe('1$(internal:custom_var)')
	})
})
