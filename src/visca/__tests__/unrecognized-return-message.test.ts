import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { OnScreenDisplayClose } from '../../camera/commands.js'
import { OnScreenDisplayCloseBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CameraReplyNetworkChange,
	CommandFailedFatally,
	SendCommand,
} from './camera-interactions/interactions.js'
import { MatchVISCABytes, UnrecognizedErrorMatcher, UnrecognizedFormatMatcher } from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('unrecognized return message', () => {
	test('unrecognized return message', async () => {
		const UnknownReturn = [0x90, 0x70, 0x17, 0xff] // 70 not 4x/5x/6x
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'close'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // close
				CameraReplyBytes(UnknownReturn), // close
				CommandFailedFatally([UnrecognizedFormatMatcher, MatchVISCABytes(UnknownReturn)], 'close'),
			],
			InstanceStatus.ConnectionFailure,
		)
	})

	test('unrecognized *specifically an error* return message', async () => {
		const UnrecognizedError = [0x90, 0x60, 0x17, 0xff] // 17 not 41/03/02 as 60 requires
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'close'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // close
				CameraReplyNetworkChange([0xd0, 0x38, 0xff]), // not essential to this test: randomly added to tests
				CameraReplyBytes(UnrecognizedError), // close
				CommandFailedFatally([UnrecognizedErrorMatcher, MatchVISCABytes(UnrecognizedError)], 'close'),
			],
			InstanceStatus.ConnectionFailure,
		)
	})
})
