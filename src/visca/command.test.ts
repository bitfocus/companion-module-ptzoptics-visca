// eslint-disable-next-line n/no-unpublished-import
import { describe, expect, test } from '@jest/globals'
import { ModuleDefinedCommand, UserDefinedCommand } from './command.js'
import { OnScreenDisplayInquiry } from '../commands.js'

describe('isUserDefined function', () => {
	test('module-defined command is not user-defined', () => {
		const mdc = new ModuleDefinedCommand([0x81, 0x12, 0x34, 0xff])
		expect(mdc.isUserDefined()).toBe(false)
	})
	test('user-defined command is user-defined', () => {
		const udc = new UserDefinedCommand([0x81, 0x12, 0x34, 0xff])
		expect(udc.isUserDefined()).toBe(true)
	})

	test('OSD inquiry is not user-defined', () => {
		expect(OnScreenDisplayInquiry.isUserDefined()).toBe(false)
	})
})
