import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { FocusLock, FocusNearStandard, FocusStop } from '../../camera/commands.js'
import { ExposureModeInquiry, FocusModeInquiry } from '../../camera/inquiries.js'
import {
	ACK,
	ExposureModeInquiryBytes,
	FocusLockBytes,
	FocusModeInquiryBytes,
	FocusNearStandardBytes,
	FocusStopBytes,
} from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CameraReplyNetworkChange,
	CommandFailedFatally,
	InquiryFailedFatally,
	InstanceStatusIs,
	SendCommand,
	SendInquiry,
} from './camera-interactions/interactions.js'
import { BadReturnNot90Matcher, BadReturnStartByteMatcher, MatchVISCABytes } from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('VISCA return message syntax errors', () => {
	test('return message bad start byte FF', async () => {
		const BadReply = [0xff, 0x42]
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes(BadReply), // focus-near
				CommandFailedFatally([BadReturnStartByteMatcher, MatchVISCABytes(BadReply)], 'focus-near'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('return message bad start byte a0', async () => {
		const BadReply = [0xa0, 0x42, 0xff]
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes(BadReply), // focus-near
				CommandFailedFatally([BadReturnNot90Matcher, MatchVISCABytes(BadReply)], 'focus-near'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('return message bad start byte 80', async () => {
		const BadReply = [0x80, 0x42, 0xff]
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes(BadReply), // focus-near
				CommandFailedFatally([BadReturnNot90Matcher, MatchVISCABytes(BadReply)], 'focus-near'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('return message bad start byte 42', async () => {
		const BadReply = [0x42, 0x17]
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes(BadReply), // focus-near
				CommandFailedFatally([BadReturnStartByteMatcher, MatchVISCABytes(BadReply)], 'focus-near'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('bad start byte with pending commands', async () => {
		const BadReply = [0x42, 0x69]
		const BadReplyMatcher = MatchVISCABytes(BadReply)
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				SendCommand(FocusStop, 'stop'),
				SendCommand(FocusLock, 'lock'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				CameraExpectIncomingBytes(FocusStopBytes), // stop
				CameraExpectIncomingBytes(FocusLockBytes), // lock
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes(BadReply), // focus-near
				CommandFailedFatally([BadReturnStartByteMatcher, BadReplyMatcher], 'focus-near'),
				InstanceStatusIs(InstanceStatus.ConnectionFailure),
				CommandFailedFatally([BadReturnStartByteMatcher, BadReplyMatcher], 'stop'),
				CommandFailedFatally([BadReturnStartByteMatcher, BadReplyMatcher], 'lock'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('bad start byte with pending inquiries', async () => {
		const BadReply = [0x93, 0x42, 0x06]
		const BadReplyMatcher = MatchVISCABytes(BadReply)
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'near'),
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				SendInquiry(FocusModeInquiry, 'focus-mode'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // near
				CameraExpectIncomingBytes(ExposureModeInquiryBytes), // exposure-mode
				CameraExpectIncomingBytes(FocusModeInquiryBytes), // focus-mode
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyNetworkChange([0xb0, 0x38, 0xff]), // not essential to this test: randomly added to tests
				CameraReplyBytes(BadReply), // near
				CommandFailedFatally([BadReturnStartByteMatcher, BadReplyMatcher], 'near'),
				InstanceStatusIs(InstanceStatus.ConnectionFailure),
				InquiryFailedFatally([BadReturnStartByteMatcher, BadReplyMatcher], 'exposure-mode'),
				InquiryFailedFatally([BadReturnStartByteMatcher, BadReplyMatcher], 'focus-mode'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('bad start byte with pending commands *and* inquiries', async () => {
		const BadReply = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]
		const BadReplyMatcher = MatchVISCABytes(BadReply.slice(0, 8))
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'near'),
				SendCommand(FocusLock, 'lock'),
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				SendInquiry(FocusModeInquiry, 'focus-mode'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // near
				CameraExpectIncomingBytes(FocusLockBytes), // lock
				CameraExpectIncomingBytes(ExposureModeInquiryBytes), // exposure-mode
				CameraExpectIncomingBytes(FocusModeInquiryBytes), // focus-mode
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]), // near
				CommandFailedFatally([BadReturnStartByteMatcher, BadReplyMatcher], 'near'),
				InstanceStatusIs(InstanceStatus.ConnectionFailure),
				CommandFailedFatally([BadReturnStartByteMatcher, BadReplyMatcher], 'lock'),
				InquiryFailedFatally([BadReturnStartByteMatcher, BadReplyMatcher], 'exposure-mode'),
				InquiryFailedFatally([BadReturnStartByteMatcher, BadReplyMatcher], 'focus-mode'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('bad start byte with half-pending command', async () => {
		const BadReply = [0x17, 0x42]
		const BadReplyMatcher = MatchVISCABytes(BadReply)
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				SendCommand(FocusStop, 'focus-stop'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				CameraExpectIncomingBytes(FocusStopBytes), // focus-stop
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes(ACK(2)), // focus-near
				CameraReplyBytes(BadReply), // focus-stop *or* a botched Completion(2)
				CommandFailedFatally([BadReturnStartByteMatcher, BadReplyMatcher], 'focus-near'),
				InstanceStatusIs(InstanceStatus.ConnectionFailure),
				CommandFailedFatally([BadReturnStartByteMatcher, BadReplyMatcher], 'focus-stop'),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})
