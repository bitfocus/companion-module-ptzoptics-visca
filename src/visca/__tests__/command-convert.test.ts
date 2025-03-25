import { InstanceStatus } from '@companion-module/base'
import { describe, test } from 'vitest'
import { ACKCompletion } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CommandSucceeded,
	SendCommand,
} from './camera-interactions/interactions.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'
import { ModuleDefinedCommand } from '../command.js'

describe('command parameter conversions', () => {
	test('command with no parameters (omitted)', async () => {
		const NoParamsCmd = new ModuleDefinedCommand([0x81, 0x00, 0xff]) // params omitted

		return RunCameraInteractionTest(
			[
				SendCommand(NoParamsCmd, 'cmd-1'),
				CameraExpectIncomingBytes([0x81, 0x00, 0xff]), // cmd-1
				SendCommand(NoParamsCmd, 'cmd-2'),
				CameraExpectIncomingBytes([0x81, 0x00, 0xff]), // cmd-2
				CameraReplyBytes(ACKCompletion(2)), // cmd-1
				CommandSucceeded('cmd-1'),
				CameraReplyBytes(ACKCompletion(1)), // cmd-2
				CommandSucceeded('cmd-2'),
			],
			InstanceStatus.Ok,
		)
	})

	test('command with no parameters (empty)', async () => {
		const NoParamsCmd = new ModuleDefinedCommand([0x81, 0x00, 0xff], {}) // empty params

		return RunCameraInteractionTest(
			[
				SendCommand(NoParamsCmd, 'cmd-1'),
				CameraExpectIncomingBytes([0x81, 0x00, 0xff]), // cmd-1
				SendCommand(NoParamsCmd, 'cmd-2'),
				CameraExpectIncomingBytes([0x81, 0x00, 0xff]), // cmd-2
				CameraReplyBytes(ACKCompletion(2)), // cmd-1
				CommandSucceeded('cmd-1'),
				CameraReplyBytes(ACKCompletion(1)), // cmd-2
				CommandSucceeded('cmd-2'),
			],
			InstanceStatus.Ok,
		)
	})

	test('command with one parameter and conversion', async () => {
		const OneConvertingParamCmd = new ModuleDefinedCommand([0x81, 0x00, 0xff], {
			param: {
				nibbles: [2, 3],
				convert: (val: string): number => {
					return parseInt(val, 16)
				},
			},
		})

		return RunCameraInteractionTest(
			[
				SendCommand(OneConvertingParamCmd, { param: 'b' }, 'cmd-1'),
				CameraExpectIncomingBytes([0x81, 0x0b, 0xff]), // cmd-1
				SendCommand(OneConvertingParamCmd, { param: '37' }, 'cmd-2'),
				CameraExpectIncomingBytes([0x81, 0x37, 0xff]), // cmd-2
				CameraReplyBytes(ACKCompletion(2)), // cmd-1
				CommandSucceeded('cmd-1'),
				CameraReplyBytes(ACKCompletion(1)), // cmd-2
				CommandSucceeded('cmd-2'),
			],
			InstanceStatus.Ok,
		)
	})

	test('command with one parameter and conversion from limited type', async () => {
		type ParamType = 'on' | 'off'
		const OneConvertingParamCmd = new ModuleDefinedCommand([0x81, 0x00, 0xff], {
			param: {
				nibbles: [3],
				convert: (val: ParamType): number => {
					switch (val) {
						case 'off':
							return 0x0
						case 'on':
							return 0x1
						default:
							return 0x9
					}
				},
			},
		})

		return RunCameraInteractionTest(
			[
				SendCommand(OneConvertingParamCmd, { param: 'off' }, 'cmd-1'),
				CameraExpectIncomingBytes([0x81, 0x00, 0xff]), // cmd-1
				SendCommand(OneConvertingParamCmd, { param: 'on' }, 'cmd-2'),
				CameraExpectIncomingBytes([0x81, 0x01, 0xff]), // cmd-2
				CameraReplyBytes(ACKCompletion(2)), // cmd-1
				SendCommand(OneConvertingParamCmd, { param: 'invalid' as ParamType }, 'cmd-3'),
				CameraReplyBytes(ACKCompletion(1)), // cmd-2
				CameraExpectIncomingBytes([0x81, 0x09, 0xff]), // cmd-3
				CommandSucceeded('cmd-1'),
				CameraReplyBytes(ACKCompletion(4)), // cmd-3
				CommandSucceeded('cmd-2'),
				CommandSucceeded('cmd-3'),
			],
			InstanceStatus.Ok,
		)
	})

	test('command with mixture of conversions', async () => {
		type Corner = 'upper-right' | 'lower-left'

		const PanTiltSetLimit = new ModuleDefinedCommand(
			[0x81, 0x01, 0x06, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff],
			{
				panLimit: {
					nibbles: [13, 15, 17, 19],
					// semantic value is numeric value, no conversion needed
				},
				corner: {
					nibbles: [11],
					convert: (corner: Corner): number => {
						switch (corner) {
							case 'upper-right':
								return 1
							case 'lower-left':
								return 2
							default:
								throw new RangeError(`invalid corner: ${corner}`)
						}
					},
				},
				tiltLimit: {
					nibbles: [21, 23, 25, 27],
					// semantic value is numeric value, no conversion needed
				},
			},
		)

		return RunCameraInteractionTest(
			[
				SendCommand(
					PanTiltSetLimit,
					{
						corner: 'lower-left',
						panLimit: 0x1234,
						tiltLimit: 0x5678,
					},
					'setlimit-1',
				),
				CameraExpectIncomingBytes([
					0x81, 0x01, 0x06, 0x07, 0x00, 0x02, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0xff,
				]), // setlimit-1
				CameraReplyBytes(ACKCompletion(1)), // setlimit-1
				CommandSucceeded('setlimit-1'),
				SendCommand(
					PanTiltSetLimit,
					{
						corner: 'upper-right',
						panLimit: 0x8675,
						tiltLimit: 0x3090,
					},
					'setlimit-2',
				),
				CameraExpectIncomingBytes([
					0x81, 0x01, 0x06, 0x07, 0x00, 0x01, 0x08, 0x06, 0x07, 0x05, 0x03, 0x00, 0x09, 0x00, 0xff,
				]), // setlimit-2
				CameraReplyBytes(ACKCompletion(1)), // setlimit-2
				CommandSucceeded('setlimit-2'),
			],
			InstanceStatus.Ok,
		)
	})
})
