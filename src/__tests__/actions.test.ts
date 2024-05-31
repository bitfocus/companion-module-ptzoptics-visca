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
		const testEvent: CompanionActionEvent = {
			id: 'xvoL964H3jiHhMP_UAdIJ',
			actionId: 'recallPset',
			controlId: 'bank:DwwXN-l4qpqi1Hh_29a50',
			options: { val: '04' },
			surfaceId: 'hot:edit',
		}
		await actions[PtzOpticsActionId.RecallPreset]?.callback(testEvent, testMock as any)
		expect(testMock.getLastCommand()).toBe('[81 01 04 3F 02 04 FF]')
	})

	test('Variable value contant used dec 37', async () => {
		testMock.resetLastCommand()
		const testEvent: CompanionActionEvent = {
			id: 'xvoL964H3jiHhMP_UAdIJ',
			actionId: 'recallPset',
			controlId: 'bank:DwwXN-l4qpqi1Hh_29a50',
			options: { val: '37' },
			surfaceId: 'hot:edit',
		}
		await actions[PtzOpticsActionId.RecallPresetFromVar]?.callback(testEvent, testMock as any)
		expect(testMock.getLastCommand()).toBe('[81 01 04 3F 02 25 FF]')
	})
	test('Variable value variable does not resolve to valid recall preset', async () => {
		testMock.resetLastCommand()
		const testEvent: CompanionActionEvent = {
			id: 'xvoL964H3jiHhMP_UAdIJ',
			actionId: 'recallPset',
			controlId: 'bank:DwwXN-l4qpqi1Hh_29a50',
			options: { val: 'foo' },
			surfaceId: 'hot:edit',
		}
		await actions[PtzOpticsActionId.RecallPresetFromVar]?.callback(testEvent, testMock as any)
		expect(testMock.getLastCommand()).toBe('')
	})
	test('Variable value constant invalid preset', async () => {
		testMock.resetLastCommand()
		const testEvent: CompanionActionEvent = {
			id: 'xvoL964H3jiHhMP_UAdIJ',
			actionId: 'recallPset',
			controlId: 'bank:DwwXN-l4qpqi1Hh_29a50',
			options: { val: '99' },
			surfaceId: 'hot:edit',
		}
		await actions[PtzOpticsActionId.RecallPresetFromVar]?.callback(testEvent, testMock as any)
		expect(testMock.getLastCommand()).toBe('')
	})

	test('Variable value resolves to dec 254', async () => {
		testMock.resetLastCommand()
		testMock.setVariableInMapEntry('foo', '254')
		const testEvent: CompanionActionEvent = {
			id: 'xvoL964H3jiHhMP_UAdIJ',
			actionId: 'recallPset',
			controlId: 'bank:DwwXN-l4qpqi1Hh_29a50',
			options: { val: 'foo' },
			surfaceId: 'hot:edit',
		}
		await actions[PtzOpticsActionId.RecallPresetFromVar]?.callback(testEvent, testMock as any)
		expect(testMock.getLastCommand()).toBe('[81 01 04 3F 02 FE FF]')
	})

	test('Invalid preset value dec 255', async () => {
		testMock.resetLastCommand()
		const testEvent: CompanionActionEvent = {
			id: 'xvoL964H3jiHhMP_UAdIJ',
			actionId: 'recallPset',
			controlId: 'bank:DwwXN-l4qpqi1Hh_29a50',
			options: { val: '255' },
			surfaceId: 'hot:edit',
		}
		await actions[PtzOpticsActionId.RecallPresetFromVar]?.callback(testEvent, testMock as any)
		expect(testMock.getLastCommand()).toBe('')
	})
})
