import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { OnScreenDisplayClose, OnScreenDisplayToggle } from '../../camera/osd.js'
import {
	ACKCompletion,
	CommandBufferFullBytes,
	OnScreenDisplayCloseBytes,
	OnScreenDisplayToggleBytes,
} from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CameraReplyNetworkChange,
	CommandFailed,
	CommandSucceeded,
	SendCommand,
} from './camera-interactions/interactions.js'
import { CommandBufferFullMatcher, MatchVISCABytes } from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('VISCA port command buffer full', () => {
	test('command buffer full, resent', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'close'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // close
				CameraReplyBytes(CommandBufferFullBytes), // close
				CameraReplyNetworkChange([0xa0, 0x38, 0xff]), // not essential to this test: randomly added to tests
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // close again
				CameraReplyBytes(ACKCompletion(2)), // close again
				CommandSucceeded('close'),
			],
			InstanceStatus.Ok,
		)
	})

	test('command buffer full, dropped', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'close'),
				SendCommand(OnScreenDisplayToggle, 'toggle'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // close
				CameraExpectIncomingBytes(OnScreenDisplayToggleBytes), // toggle
				CameraReplyBytes(CommandBufferFullBytes), // close
				CommandFailed([CommandBufferFullMatcher, MatchVISCABytes(OnScreenDisplayCloseBytes)], 'close'),
				CameraReplyBytes(ACKCompletion(2)), // toggle
				CommandSucceeded('toggle'),
			],
			InstanceStatus.Ok,
		)
	})
})
