import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { FocusNearStandard } from '../../camera/commands.js'
import { ExposureModeInquiry } from '../../camera/inquiries.js'
import { CommandNotExecutable, ExposureModeInquiryBytes, FocusNearStandardBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CommandFailed,
	InquiryFailedFatally,
	InquirySucceeded,
	InstanceStatusIs,
	SendCommand,
	SendInquiry,
} from './camera-interactions/interactions.js'
import {
	CantBeExecutedNowMatcher,
	MatchVISCABytes,
	NotExecutableWithNoCommandsAwaitingInitialResponseMatcher,
} from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('command not executable error', () => {
	test('command not executable', async () => {
		// This sequence can happen when the camera is in auto focus mode.
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				CameraReplyBytes(CommandNotExecutable(0xf)), // focus-near
				CommandFailed([CantBeExecutedNowMatcher, MatchVISCABytes(FocusNearStandardBytes)], 'focus-near'),
			],
			InstanceStatus.Ok,
		)
	})

	test('command not executable, no pending commands', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				CameraExpectIncomingBytes(ExposureModeInquiryBytes), // exposure-mode
				CameraReplyBytes(CommandNotExecutable(7)), // exposure-mode
				InquiryFailedFatally(
					[NotExecutableWithNoCommandsAwaitingInitialResponseMatcher, MatchVISCABytes(CommandNotExecutable(7))],
					'exposure-mode',
				),
			],
			InstanceStatus.ConnectionFailure,
		)
	})

	test('command not executable, after a pending inquiry', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				CameraExpectIncomingBytes(ExposureModeInquiryBytes), // exposure-mode
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				CameraReplyBytes(CommandNotExecutable(1)), // focus-near
				CommandFailed([CantBeExecutedNowMatcher, MatchVISCABytes(FocusNearStandardBytes)], 'focus-near'),
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes([0x90, 0x50, 0x0a, 0xff]), // exposure-mode
				InquirySucceeded({ val: '2' }, 'exposure-mode'),
			],
			InstanceStatus.Ok,
		)
	})
})
