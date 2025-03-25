import { InstanceStatus } from '@companion-module/base'
import { describe, test } from 'vitest'
import { FocusNearStandard } from '../../camera/focus.js'
import { ACK, FocusNearStandardBytes, SyntaxErrorBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CommandFailedFatally,
	SendCommand,
} from './camera-interactions/interactions.js'
import { MatchVISCABytes, NoMessagesAwaitingInitialResponseMatcher } from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('command error with no commands awaiting initial response', () => {
	test('command error with one command acknowledged', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				CameraReplyBytes(ACK(1)), // focus-near
				CameraReplyBytes(SyntaxErrorBytes),
				CommandFailedFatally(
					[NoMessagesAwaitingInitialResponseMatcher, MatchVISCABytes(SyntaxErrorBytes)],
					'focus-near',
				),
			],
			InstanceStatus.ConnectionFailure,
		)
	})
})
