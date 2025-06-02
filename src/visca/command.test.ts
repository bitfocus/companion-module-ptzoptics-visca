import type { Expect, Equal } from 'type-testing'
import { describe, expect, test } from 'vitest'
import { OnScreenDisplayClose } from '../camera/osd.js'
import {
	type Command,
	type CommandParameters,
	type CommandParamValues,
	ModuleDefinedCommand,
	UserDefinedCommand,
} from './command.js'
import { OnScreenDisplayCloseBytes } from './__tests__/camera-interactions/bytes.js'
import type { ReadonlyRecord } from '../utils/readonly-record.js'

type ParametersForCommand<C extends Command<any>> =
	C extends Command<infer P> ? (P extends CommandParameters ? CommandParamValues<P> : never) : never

const _NoParameters = new ModuleDefinedCommand([0x81, 0x01, 0x07, 0xff])

// @ts-expect-error Perform a test that *must fail* to verify testing happens.
type test_VerifyThatExpectAndEqualWillErrorIfMisused = Expect<Equal<true, false>>

type test_NoParameters_paramValues = Expect<
	Equal<
		// param values for parameter-less comment are empty
		ParametersForCommand<typeof _NoParameters>,
		ReadonlyRecord<string, never>
	>
>

const _OneParameterNumeric = new ModuleDefinedCommand([0x81, 0x01, 0x02, 0x00, 0x0ff], {
	parameter: {
		nibbles: [7],
	},
})

type test_OneParameterNumeric_paramValues = Expect<
	Equal<
		// param values for one numeric parameter
		ParametersForCommand<typeof _OneParameterNumeric>,
		{ readonly parameter: number }
	>
>

const _OneParameterTyped = new ModuleDefinedCommand([0x81, 0x01, 0x02, 0x00, 0x0ff], {
	parameter: {
		nibbles: [7],
		convert: (val: string): number => {
			return Number(val)
		},
	},
})

type test_OneParameterTyped_paramValues = Expect<
	Equal<
		// param values for one numeric parameter
		ParametersForCommand<typeof _OneParameterTyped>,
		{ readonly parameter: string }
	>
>

const _MixedParameters = new ModuleDefinedCommand([0x81, 0x01, 0x02, 0x00, 0x00, 0x0ff], {
	stringParameter: {
		nibbles: [7],
		convert: (val: string): number => {
			return Number(val)
		},
	},
	numericParameter: {
		nibbles: [9],
	},
})

type test_MixedParameters_paramValues = Expect<
	Equal<
		// param values for mixed parameters
		ParametersForCommand<typeof _MixedParameters>,
		{ readonly stringParameter: string; readonly numericParameter: number }
	>
>

describe('no command parameters', () => {
	test('command with no parameters supports toBytes with no parameters', () => {
		const cmdBytes = [0x81, 0x01, 0x02, 0xff] as const
		const cmd = new ModuleDefinedCommand(cmdBytes)
		expect(cmd.toBytes()).toEqual(cmdBytes)
	})

	test('command with explicit no parameters supports toBytes with no parameters', () => {
		const cmdBytes = [0x81, 0x01, 0x02, 0xff] as const
		const cmd = new ModuleDefinedCommand(cmdBytes, {})
		expect(cmd.toBytes()).toEqual(cmdBytes)
	})
})

describe('isUserDefined function', () => {
	test('module-defined command is not user-defined', () => {
		const mdc = new ModuleDefinedCommand([0x81, 0x12, 0x34, 0xff])
		expect(mdc.isUserDefined()).toBe(false)
	})
	test('user-defined command is user-defined', () => {
		const udc = new UserDefinedCommand([0x81, 0x12, 0x34, 0xff])
		expect(udc.isUserDefined()).toBe(true)
	})

	test('OSD close command is not user-defined', () => {
		expect(OnScreenDisplayClose.isUserDefined()).toBe(false)
		expect(OnScreenDisplayClose.toBytes()).toEqual(OnScreenDisplayCloseBytes)
	})
})
