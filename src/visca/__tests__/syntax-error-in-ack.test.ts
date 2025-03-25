import { InstanceStatus } from '@companion-module/base'
import { describe, test } from 'vitest'
import { FocusNearStandard } from '../../camera/focus.js'
import { FocusNearStandardBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CameraReplyNetworkChange,
	CommandFailedFatally,
	InstanceStatusIs,
	SendCommand,
} from './camera-interactions/interactions.js'
import { BadReturnStartByteMatcher, MatchVISCABytes } from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

const BadACKMatcher = /^Received malformed ACK, closing connection to avoid send\/receive decoherence/

describe('VISCA ACK syntax errors', () => {
	test('return message bad start byte FF', async () => {
		const TooLongACK = [0x90, 0x40, 0x33, 0xff]
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes(TooLongACK), // focus-near, ACK but extra 33 byte
				CommandFailedFatally([BadACKMatcher, MatchVISCABytes(TooLongACK)], 'focus-near'),
			],
			InstanceStatus.ConnectionFailure,
		)
	})

	test('return message bad start byte 42', async () => {
		const BadStartByte = [0x42]
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				CameraReplyNetworkChange([0xb0, 0x38, 0xff]), // not essential to this test: randomly added to tests
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes(BadStartByte), // focus-near
				CommandFailedFatally([BadReturnStartByteMatcher, MatchVISCABytes(BadStartByte)], 'focus-near'),
			],
			InstanceStatus.ConnectionFailure,
		)
	})
})
