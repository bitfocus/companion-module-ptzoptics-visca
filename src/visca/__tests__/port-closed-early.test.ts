import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { ExposureModeInquiry } from '../../camera/exposure.js'
import { FocusNearStandard, FocusStop } from '../../camera/focus.js'
import { ACK, ExposureModeInquiryBytes, FocusNearStandardBytes, FocusStopBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CameraReplyNetworkChange,
	CloseVISCAPortEarly,
	CommandFailedFatally,
	InquiryFailedFatally,
	InstanceStatusIs,
	SendCommand,
	SendInquiry,
} from './camera-interactions/interactions.js'
import { CloseVISCAPortEarlyMatcher } from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('VISCA port closed early', () => {
	test('manual close with commands waiting for initial response *and* completion', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				SendCommand(FocusStop, 'focus-stop'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				CameraExpectIncomingBytes(FocusStopBytes), // focus-stop
				CameraReplyBytes(ACK(2)), // focus-near
				CloseVISCAPortEarly(),
				InstanceStatusIs(InstanceStatus.Disconnected),
				CommandFailedFatally(CloseVISCAPortEarlyMatcher, 'focus-near'),
				CommandFailedFatally(CloseVISCAPortEarlyMatcher, 'focus-stop'),
			],
			InstanceStatus.Disconnected,
		)
	})

	test('manual close with half-completed command and inquiry waiting for initial response', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near
				CameraExpectIncomingBytes(ExposureModeInquiryBytes), // exposure-mode
				CameraReplyNetworkChange([0xe0, 0x38, 0xff]), // not essential to this test: randomly added to tests
				CameraReplyBytes(ACK(2)), // focus-near
				CloseVISCAPortEarly(),
				InstanceStatusIs(InstanceStatus.Disconnected),
				CommandFailedFatally(CloseVISCAPortEarlyMatcher, 'focus-near'),
				InquiryFailedFatally(CloseVISCAPortEarlyMatcher, 'exposure-mode'),
			],
			InstanceStatus.Disconnected,
		)
	})
})
