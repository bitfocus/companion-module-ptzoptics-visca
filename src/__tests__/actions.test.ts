import { describe, expect, test } from '@jest/globals'

import { getActions } from '../actions.js'
import { PtzOpticsActionId } from '../actions-enum.js'
import { CompanionActionEvent } from '@companion-module/base'
import { ActionsMock } from './actions-mock.js'

const testMock = new ActionsMock()

describe('test recall preset values', () => {
	const actions = getActions(testMock as any)
	test('Dropdown value used', async () => {
		testMock.resetLastCommand()
		const testEvent = {
			id: 'xvoL964H3jiHhMP_UAdIJ',
			actionId: 'recallPset',
			controlId: 'bank:DwwXN-l4qpqi1Hh_29a50',
			options: { val: '04', useVariableForPreset: false, recallPresetVariableVal: 'ff' },
			surfaceId: 'hot:edit',
		} as CompanionActionEvent
		await actions[PtzOpticsActionId.RecallPreset]?.callback(testEvent, testMock as any)
		expect(testMock.getLastCommand()).toBe('[81 01 04 3F 02 04 FF]')
	})

	test('Variable value contant used dec 37', async () => {
		testMock.resetLastCommand()
		const testEvent = {
			id: 'xvoL964H3jiHhMP_UAdIJ',
			actionId: 'recallPset',
			controlId: 'bank:DwwXN-l4qpqi1Hh_29a50',
			options: { val: '04', useVariableForPreset: true, recallPresetVariableVal: '37' },
			surfaceId: 'hot:edit',
		} as CompanionActionEvent
		await actions[PtzOpticsActionId.RecallPreset]?.callback(testEvent, testMock as any)
		expect(testMock.getLastCommand()).toBe('[81 01 04 3F 02 25 FF]')
	})
	test('Variable value variable does not resolve to valid recall preset', async () => {
		testMock.resetLastCommand()
		const testEvent = {
			id: 'xvoL964H3jiHhMP_UAdIJ',
			actionId: 'recallPset',
			controlId: 'bank:DwwXN-l4qpqi1Hh_29a50',
			options: { val: '04', useVariableForPreset: true, recallPresetVariableVal: 'foo' },
			surfaceId: 'hot:edit',
		} as CompanionActionEvent
		await actions[PtzOpticsActionId.RecallPreset]?.callback(testEvent, testMock as any)
		expect(testMock.getLastCommand()).toBe('')
	})
	test('Variable value constant invalid preset', async () => {
		testMock.resetLastCommand()
		const testEvent = {
			id: 'xvoL964H3jiHhMP_UAdIJ',
			actionId: 'recallPset',
			controlId: 'bank:DwwXN-l4qpqi1Hh_29a50',
			options: { val: '04', useVariableForPreset: true, recallPresetVariableVal: '99' },
			surfaceId: 'hot:edit',
		} as CompanionActionEvent
		await actions[PtzOpticsActionId.RecallPreset]?.callback(testEvent, testMock as any)
		expect(testMock.getLastCommand()).toBe('')
	})

	test('Variable value resolves to dec 254', async () => {
		testMock.resetLastCommand()
		testMock.setVariableInMapEntry('foo', '254')
		const testEvent = {
			id: 'xvoL964H3jiHhMP_UAdIJ',
			actionId: 'recallPset',
			controlId: 'bank:DwwXN-l4qpqi1Hh_29a50',
			options: { val: '04', useVariableForPreset: true, recallPresetVariableVal: 'foo' },
			surfaceId: 'hot:edit',
		} as CompanionActionEvent
		await actions[PtzOpticsActionId.RecallPreset]?.callback(testEvent, testMock as any)
		expect(testMock.getLastCommand()).toBe('[81 01 04 3F 02 FE FF]')
	})
})
