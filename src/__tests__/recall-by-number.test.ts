import { describe, expect, test } from '@jest/globals'
import { parsePresetVariableOption } from '../recall-by-number.js'
//import { getActions } from '../actions.js'
//import { PtzOpticsActionId } from '../actions-enum.js'
import { CompanionOptionValues } from '@companion-module/base'
//import { ActionsMock } from './actions-mock.js'
import { PresetRecall } from '../camera/commands.js'
import { prettyBytes } from '../visca/utils.js'
import { MockContext } from './mock-context.js'

describe('test recall preset values', () => {
	test('Variable value contant used dec 37', async () => {
		const context = new MockContext()
		const input: CompanionOptionValues = { val: '37' }
		const result = await parsePresetVariableOption(input, context)
		//console.log("type of result is: " + typeof(result))
		expect(typeof result).toBe('object')
		expect(prettyBytes(PresetRecall.toBytes(result as CompanionOptionValues))).toBe('[81 01 04 3F 02 25 FF]')
	})
	test('Variable value variable does not resolve to valid recall preset', async () => {
		const context = new MockContext()
		const input: CompanionOptionValues = { val: 'foo' }
		const result = await parsePresetVariableOption(input, context)
		expect(typeof result).toBe('string')
		expect(result).toContain('Invalid recall preset value of')
	})
	test('Variable value constant invalid preset', async () => {
		const context = new MockContext()
		const input: CompanionOptionValues = { val: '99' }
		const result = await parsePresetVariableOption(input, context)
		expect(typeof result).toBe('string')
		expect(result).toContain('Invalid recall preset value of')
	})

	test('Variable value resolves to dec 254', async () => {
		const context = new MockContext()
		context.setVariable('internal:foo', '254')
		const input: CompanionOptionValues = { val: '$(internal:foo)' }
		const result = await parsePresetVariableOption(input, context)
		//console.log("type of result is: " + typeof(result))
		expect(typeof result).toBe('object')
		expect(prettyBytes(PresetRecall.toBytes(result as CompanionOptionValues))).toBe('[81 01 04 3F 02 FE FF]')
	})

	test('Invalid preset value dec 255', async () => {
		const context = new MockContext()
		const input: CompanionOptionValues = { val: '255' }
		const result = await parsePresetVariableOption(input, context)
		expect(typeof result).toBe('string')
		expect(result).toContain('Invalid recall preset value of')
	})
})
