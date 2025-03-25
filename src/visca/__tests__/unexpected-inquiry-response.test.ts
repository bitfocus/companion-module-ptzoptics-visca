import { InstanceStatus } from '@companion-module/base'
import { describe, test } from 'vitest'
import { FocusLock, FocusModeInquiry } from '../../camera/focus.js'
import { ACK, FocusLockBytes, FocusModeInquiryBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CameraReplyNetworkChange,
	CommandFailedFatally,
	InquirySucceeded,
	SendCommand,
	SendInquiry,
} from './camera-interactions/interactions.js'
import { InquiryResponseWithoutInquiryMatcher, MatchVISCABytes } from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('no pending inquiry', () => {
	test('inquiry response with command waiting initial response', async () => {
		const InquiryResponse = [0x90, 0x50, 0x37 /* makes it an inquiry response */, 0xff]
		return RunCameraInteractionTest(
			[
				SendCommand(FocusLock, 'focus-lock'),
				CameraExpectIncomingBytes(FocusLockBytes), // focus-lock
				CameraReplyBytes(InquiryResponse),
				CommandFailedFatally([InquiryResponseWithoutInquiryMatcher, MatchVISCABytes(InquiryResponse)], 'focus-lock'),
			],
			InstanceStatus.ConnectionFailure,
		)
	})

	test('inquiry response with command waiting initial response, past inquiry', async () => {
		const InquiryResponse = [0x90, 0x50, 0x42 /* makes it an inquiry response */, 0xff]
		return RunCameraInteractionTest(
			[
				SendCommand(FocusLock, 'focus-lock'),
				SendInquiry(FocusModeInquiry, 'focus-mode'),
				CameraExpectIncomingBytes(FocusLockBytes), // focus-lock
				CameraExpectIncomingBytes(FocusModeInquiryBytes), // focus-mode
				CameraReplyBytes([0x90, 0x50, 0x02, 0xff]), // focus-mode
				InquirySucceeded({ mode: 'auto' }, 'focus-mode'),
				CameraReplyBytes(InquiryResponse),
				CommandFailedFatally([InquiryResponseWithoutInquiryMatcher, MatchVISCABytes(InquiryResponse)], 'focus-lock'),
			],
			InstanceStatus.ConnectionFailure,
		)
	})

	test('inquiry response with only command waiting for completion', async () => {
		const InquiryResponse = [0x90, 0x50, 0x17 /* makes it an inquiry response */, 0xff]
		return RunCameraInteractionTest(
			[
				SendCommand(FocusLock, 'focus-lock'),
				CameraExpectIncomingBytes(FocusLockBytes), // focus-lock
				CameraReplyBytes(ACK(1)), // focus-lock
				CameraReplyNetworkChange([0x90, 0x38, 0xff]), // not essential to this test: randomly added to tests
				CameraReplyBytes(InquiryResponse),
				CommandFailedFatally([InquiryResponseWithoutInquiryMatcher, MatchVISCABytes(InquiryResponse)], 'focus-lock'),
			],
			InstanceStatus.ConnectionFailure,
		)
	})
})
