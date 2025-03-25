import { InstanceStatus } from '@companion-module/base'
import { describe, test } from 'vitest'
import { OnScreenDisplayClose, OnScreenDisplayInquiry } from '../../camera/osd.js'
import {
	ACKCompletion,
	OnScreenDisplayCloseBytes,
	OnScreenDisplayInquiryBytes,
	SyntaxErrorBytes,
} from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CommandFailed,
	CommandSucceeded,
	InquiryFailed,
	InquirySucceeded,
	SendCommand,
	SendInquiry,
} from './camera-interactions/interactions.js'
import {
	BlameModuleMatcher,
	CameraReportedSyntaxErrorMatcher,
	MatchVISCABytes,
} from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('VISCA port sending/receiving basics', () => {
	test('simple command succeeding', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'osd-close'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // osd-close
				CameraReplyBytes(ACKCompletion(1)), // osd-close
				CommandSucceeded('osd-close'),
			],
			InstanceStatus.Ok,
		)
	})

	test('simple command failing', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'osd-close'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // osd-close
				CameraReplyBytes(SyntaxErrorBytes),
				CommandFailed(
					[CameraReportedSyntaxErrorMatcher, MatchVISCABytes(OnScreenDisplayCloseBytes), BlameModuleMatcher],
					'osd-close',
				),
			],
			InstanceStatus.Ok,
		)
	})

	test('simple inquiry succeeding', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(OnScreenDisplayInquiry, 'osd-inquiry'),
				CameraExpectIncomingBytes(OnScreenDisplayInquiryBytes), // osd-inquiry
				CameraReplyBytes([0x90, 0x50, 0x02, 0xff]), // osd-inquiry
				InquirySucceeded({ state: 'open' }, 'osd-inquiry'),
			],
			InstanceStatus.Ok,
		)
	})

	test('simple inquiry failing', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(OnScreenDisplayInquiry, 'osd-inquiry'),
				CameraExpectIncomingBytes(OnScreenDisplayInquiryBytes), // osd-inquiry
				CameraReplyBytes(SyntaxErrorBytes), // osd-inquiry
				InquiryFailed(
					[CameraReportedSyntaxErrorMatcher, MatchVISCABytes(OnScreenDisplayInquiryBytes), BlameModuleMatcher],
					'osd-inquiry',
				),
			],
			InstanceStatus.Ok,
		)
	})
})
