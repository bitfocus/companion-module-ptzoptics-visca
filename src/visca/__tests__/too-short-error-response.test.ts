import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { OnScreenDisplayClose } from '../../camera/commands.js'
import { ExposureModeInquiry } from '../../camera/inquiries.js'
import { ExposureModeInquiryBytes, OnScreenDisplayCloseBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CommandFailedFatally,
	InquiryFailedFatally,
	SendCommand,
	SendInquiry,
} from './camera-interactions/interactions.js'
import { ErrorOfUnexpectedLengthMatcher, MatchVISCABytes } from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('too-short error response', () => {
	const TooShortError = [0x90, 0x60, 0xff]
	test('too-short error response to command', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'close'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // close
				CameraReplyBytes(TooShortError), // close
				CommandFailedFatally([ErrorOfUnexpectedLengthMatcher, MatchVISCABytes(TooShortError)], 'close'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('too-short error response to inquiry', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				CameraExpectIncomingBytes(ExposureModeInquiryBytes), // exposure-mode
				CameraReplyBytes(TooShortError), // exposure-mode
				InquiryFailedFatally([ErrorOfUnexpectedLengthMatcher, MatchVISCABytes(TooShortError)], 'exposure-mode'),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})
