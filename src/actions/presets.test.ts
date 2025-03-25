import type { CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import {
	getPresetNumber,
	ObsoletePresetUseVariablesOptionId,
	ObsoletePresetValueOptionId,
	ObsoletePresetVariableOptionId,
	ObsoleteRecallPsetId,
	ObsoleteSavePsetId,
	PresetActionId,
	PresetAsNumberId,
	PresetAsTextId,
	PresetIsTextId,
	PresetRecallDefault,
	PresetSetDefault,
	RecallPresetId,
	SetPresetDriveSpeedPresetId,
	SetPresetDriveSpeedSpeedId,
	SetPresetId,
	tryUpdatePresetAndSpeedEncodingsInActions,
	tryUpdateRecallSetPresetActions,
} from './presets.js'
import { MockContext } from '../__tests__/mock-context.js'
import { repr } from '../utils/repr.js'
import { twoDigitHex } from '../utils/two-digit-hex.js'

function optionsWithPresetAsNumberOrText(isText: boolean, asText: string, asNumber: number): CompanionOptionValues {
	return {
		[PresetIsTextId]: isText,
		[PresetAsTextId]: asText,
		[PresetAsNumberId]: asNumber,
	}
}

function expectIsErrorString(result: number | string): void {
	if (typeof result !== 'string') {
		throw new TypeError(`Result should have been an error: ${repr(result)}`)
	}
}

describe('test invalid preset input', () => {
	test('User enters "foo" (not a number at all) as the preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetAsNumberOrText(true, 'foo', PresetSetDefault)
		const preset = await getPresetNumber(options, context)
		expectIsErrorString(preset)
	})

	test('User enters "foo" (not a number at all) as the preset but number input is used', async () => {
		const context = new MockContext()
		const options = optionsWithPresetAsNumberOrText(false, 'foo', PresetSetDefault)
		const preset = await getPresetNumber(options, context)
		expect(preset).toBe(PresetSetDefault)
	})

	test('User enters an invalid preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetAsNumberOrText(true, '99', PresetRecallDefault)
		const result = await getPresetNumber(options, context)
		expectIsErrorString(result)
	})

	test('User enters an invalid preset but number input is used', async () => {
		const context = new MockContext()
		const options = optionsWithPresetAsNumberOrText(false, '99', PresetRecallDefault)
		const result = await getPresetNumber(options, context)
		expect(result).toBe(PresetRecallDefault)
	})

	test('User enters a variable that resolves to an invalid preset', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '255')
		const options = optionsWithPresetAsNumberOrText(true, '$(internal:foo)', 250)
		const result = await getPresetNumber(options, context)
		expectIsErrorString(result)
	})

	test('User enters a variable that resolves to an invalid preset but number is used', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '255')
		const options = optionsWithPresetAsNumberOrText(false, '$(internal:foo)', 250)
		const result = await getPresetNumber(options, context)
		expect(result).toBe(250)
	})
})

describe('test recall preset values', () => {
	test('User enters "37" as the preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetAsNumberOrText(true, '37', 11)
		const result = await getPresetNumber(options, context)
		expect(result).toBe(37)
	})

	test('User enters "37" as the preset but number is used', async () => {
		const context = new MockContext()
		const options = optionsWithPresetAsNumberOrText(false, '37', 11)
		const result = await getPresetNumber(options, context)
		expect(result).toBe(11)
	})

	test('User enters a variable that resolves to dec 254', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '254')
		const options = optionsWithPresetAsNumberOrText(true, '$(internal:foo)', 16)
		const result = await getPresetNumber(options, context)
		expect(result).toBe(254)
	})

	test('User enters a variable that resolves to dec 254 but number is used', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '254')
		const options = optionsWithPresetAsNumberOrText(false, '$(internal:foo)', 16)
		const result = await getPresetNumber(options, context)
		expect(result).toBe(16)
	})
})

describe('test set preset values', () => {
	test('User enters "37" as the preset', async () => {
		const context = new MockContext()
		const options = optionsWithPresetAsNumberOrText(true, '37', 82)
		const result = await getPresetNumber(options, context)
		expect(result).toBe(37)
	})

	test('User enters "37" as the preset but number is used', async () => {
		const context = new MockContext()
		const options = optionsWithPresetAsNumberOrText(false, '37', 82)
		const result = await getPresetNumber(options, context)
		expect(result).toBe(82)
	})

	test('User enters a variable that resolves to dec 254', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '254')
		const options = optionsWithPresetAsNumberOrText(true, '$(internal:foo)', 77)
		const result = await getPresetNumber(options, context)
		expect(result).toBe(254)
	})

	test('User enters a variable that resolves to dec 254 but number is used', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '254')
		const options = optionsWithPresetAsNumberOrText(false, '$(internal:foo)', 77)
		const result = await getPresetNumber(options, context)
		expect(result).toBe(77)
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
					val: '123',
				},
			}

			expect(tryUpdateRecallSetPresetActions(action)).toBe(false)

			const { actionId, options } = action
			expect(actionId).toBe('foobar')
			expect(options.val).toBe('123')
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
				val: twoDigitHex(66), // '42'
			},
		}

		expect(tryUpdateRecallSetPresetActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(ObsoleteRecallPsetId)
		expect(options[ObsoletePresetUseVariablesOptionId]).toBe(false)
		expect(options[ObsoletePresetValueOptionId]).toBe('42')
		expect(options[ObsoletePresetVariableOptionId]).toBe(`66`)
	})

	test('upgradable with variable preset containing number', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'recallPsetFromVar',
			id: 'kthx',
			controlId: 'y',
			options: {
				val: '42',
			},
		}

		expect(tryUpdateRecallSetPresetActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(ObsoleteRecallPsetId)
		expect(options[ObsoletePresetUseVariablesOptionId]).toBe(true)
		expect(options[ObsoletePresetValueOptionId]).toBe(twoDigitHex(42))
		expect(options[ObsoletePresetVariableOptionId]).toBe('42')
	})

	test('upgradable with variable preset containing variable', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'recallPsetFromVar',
			id: 'kthx',
			controlId: 'y',
			options: {
				val: '1$(internal:custom_var)',
			},
		}

		expect(tryUpdateRecallSetPresetActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(ObsoleteRecallPsetId)
		expect(options[ObsoletePresetUseVariablesOptionId]).toBe(true)
		expect(options[ObsoletePresetValueOptionId]).toBe(twoDigitHex(PresetRecallDefault))
		expect(options[ObsoletePresetVariableOptionId]).toBe('1$(internal:custom_var)')
	})
})

describe('obsolete preset save upgrades', () => {
	test('upgradable with constant preset', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'savePset',
			id: 'kthx',
			controlId: 'z',
			options: {
				val: twoDigitHex(66), // '42'
			},
		}

		expect(tryUpdateRecallSetPresetActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(ObsoleteSavePsetId)
		expect(options[ObsoletePresetUseVariablesOptionId]).toBe(false)
		expect(options[ObsoletePresetValueOptionId]).toBe('42')
		expect(options[ObsoletePresetVariableOptionId]).toBe('66')
	})

	test('upgradable with variable preset containing number', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'savePsetFromVar',
			id: 'kthx',
			controlId: 'w',
			options: {
				val: '42',
			},
		}

		expect(tryUpdateRecallSetPresetActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(ObsoleteSavePsetId)
		expect(options[ObsoletePresetUseVariablesOptionId]).toBe(true)
		expect(options[ObsoletePresetValueOptionId]).toBe(twoDigitHex(42))
		expect(options[ObsoletePresetVariableOptionId]).toBe('42')
	})

	test('upgradable with variable preset containing variable', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'savePsetFromVar',
			id: 'kthx',
			controlId: 'w',
			options: {
				val: '1$(internal:custom_var)',
			},
		}

		expect(tryUpdateRecallSetPresetActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(ObsoleteSavePsetId)
		expect(options[ObsoletePresetUseVariablesOptionId]).toBe(true)
		expect(options[ObsoletePresetValueOptionId]).toBe(twoDigitHex(PresetSetDefault))
		expect(options[ObsoletePresetVariableOptionId]).toBe('1$(internal:custom_var)')
	})
})

describe('obsolete preset/speed encoding upgrades to preset actions', () => {
	test('not upgradable, unrelated', () => {
		const action: CompanionMigrationAction = {
			actionId: 'foobar',
			id: 'bai',
			controlId: 'm',
			options: {
				useVariables: 42,
				val: 17,
				presetVariable: 'element',
			},
		}

		expect(tryUpdatePresetAndSpeedEncodingsInActions(action)).toBe(false)

		const { actionId, options } = action
		expect(actionId).toBe('foobar')
		expect(options.useVariables).toBe(42)
		expect(options.val).toBe(17)
		expect(options.presetVariable).toBe('element')
		expect('isText' in options).toBe(false)
		expect('asText' in options).toBe(false)
		expect('asNumber' in options).toBe(false)
	})

	test('upgradable save preset', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'savePset',
			id: 'kthx',
			controlId: 'z',
			options: {
				useVariables: true,
				val: '42',
				presetVariable: '6$(custom:hello)',
			},
		}

		expect(tryUpdatePresetAndSpeedEncodingsInActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(SetPresetId)
		expect(ObsoletePresetUseVariablesOptionId in options).toBe(false)
		expect(options[PresetIsTextId]).toBe(true)
		expect(ObsoletePresetValueOptionId in options).toBe(false)
		expect(options[PresetAsNumberId]).toBe(66)
		expect(ObsoletePresetVariableOptionId in options).toBe(false)
		expect(options[PresetAsTextId]).toBe('6$(custom:hello)')
	})

	test('upgradable recall preset', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'recallPset',
			id: 'kthx',
			controlId: 'z',
			options: {
				useVariables: true,
				val: '17',
				presetVariable: '$(custom:hello)3',
			},
		}

		expect(tryUpdatePresetAndSpeedEncodingsInActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(RecallPresetId)
		expect(ObsoletePresetUseVariablesOptionId in options).toBe(false)
		expect(options[PresetIsTextId]).toBe(true)
		expect(ObsoletePresetValueOptionId in options).toBe(false)
		expect(options[PresetAsNumberId]).toBe(23)
		expect(ObsoletePresetVariableOptionId in options).toBe(false)
		expect(options[PresetAsTextId]).toBe('$(custom:hello)3')
	})

	test('upgradable set preset drive speed', async () => {
		const action: CompanionMigrationAction = {
			actionId: 'speedPset',
			id: 'kthx',
			controlId: 'z',
			options: {
				val: '69',
				speed: '13',
			},
		}

		expect(tryUpdatePresetAndSpeedEncodingsInActions(action)).toBe(true)

		const { actionId, options } = action
		expect(actionId).toBe(PresetActionId.SetPresetDriveSpeed)
		expect(options[SetPresetDriveSpeedPresetId]).toBe(105)
		expect(options[SetPresetDriveSpeedSpeedId]).toBe(19)
	})
})
