import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { FocusModeInquiry } from '../../camera/inquiries.js'
import { ACK, FocusModeInquiryBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CameraReplyNetworkChange,
	InquiryFailedFatally,
	SendInquiry,
} from './camera-interactions/interactions.js'
import { ACKWithoutPendingCommandMatcher, MatchVISCABytes } from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('ACK without pending command', () => {
	test('ACK with only inquiry pending', async () => {
		return RunCameraInteractionTest(
			[
				CameraReplyNetworkChange([0xf0, 0x38, 0xff]), // not essential to this test: randomly added to tests
				SendInquiry(FocusModeInquiry, 'focus-mode'),
				CameraExpectIncomingBytes(FocusModeInquiryBytes), // focus-mode
				CameraReplyBytes(ACK(1)), // focus-mode
				InquiryFailedFatally([ACKWithoutPendingCommandMatcher, MatchVISCABytes(ACK(1))], 'focus-mode'),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})
