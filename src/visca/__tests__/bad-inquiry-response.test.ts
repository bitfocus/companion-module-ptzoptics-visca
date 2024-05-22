import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { ExposureModeInquiry } from '../../camera/inquiries.js'
import { ExposureModeInquiryBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CameraReplyNetworkChange,
	InquiryFailed,
	SendInquiry,
} from './camera-interactions/interactions.js'
import {
	BlameModuleMatcher,
	InquiryResponseIncompatibleMatcher,
	MatchVISCABytes,
	UserDefinedInquiryMatcher,
} from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'
import { UserDefinedInquiry } from '../command.js'

describe('inquiry response mismatch', () => {
	const ZoomPositionInquiryBytes = [0x81, 0x09, 0x04, 0x47, 0xff]
	const ZoomPositionInquiry = new UserDefinedInquiry(ZoomPositionInquiryBytes, {
		value: [0x90, 0x50, 0x00, 0x00, 0x00, 0x00, 0xff],
		mask: [0xff, 0xff, 0xf0, 0xf0, 0xf0, 0xf0, 0xff],
		params: {
			position: {
				nibbles: [5, 7, 9, 11],
				paramToChoice: String,
			},
		},
	})

	test('actual response shorter', async () => {
		const BadReturn = [0x90, 0x50, 0x09, 0xff]
		return RunCameraInteractionTest(
			[
				SendInquiry(ZoomPositionInquiry, 'zoom-position'),
				CameraExpectIncomingBytes(ZoomPositionInquiryBytes), // zoom-position
				CameraReplyBytes(BadReturn), // zoom-position
				InquiryFailed(
					[InquiryResponseIncompatibleMatcher, MatchVISCABytes(BadReturn), UserDefinedInquiryMatcher],
					'zoom-position'
				),
			],
			InstanceStatus.Ok
		)
	})

	test('actual response longer, user-defined inquiry', async () => {
		const TooLongResponseBytes = [0x90, 0x50, 0x01, 0x02, 0x03, 0x04, 0x05, 0xff]
		return RunCameraInteractionTest(
			[
				SendInquiry(ZoomPositionInquiry, 'zoom-position'),
				CameraExpectIncomingBytes(ZoomPositionInquiryBytes), // zoom-position
				CameraReplyBytes(TooLongResponseBytes), // zoom-position
				InquiryFailed(
					[InquiryResponseIncompatibleMatcher, MatchVISCABytes(TooLongResponseBytes), UserDefinedInquiryMatcher],
					'zoom-position'
				),
			],
			InstanceStatus.Ok
		)
	})

	test('actual response mask mismatch, user-defined inquiry', async () => {
		const MaskMismatchResponseBytes = [0x90, 0x50, 0xf1, 0x02, 0x03, 0x04, 0xff]
		return RunCameraInteractionTest(
			[
				SendInquiry(ZoomPositionInquiry, 'zoom-position'),
				CameraExpectIncomingBytes(ZoomPositionInquiryBytes), // zoom-position
				CameraReplyNetworkChange([0xc0, 0x38, 0xff]), // not essential to this test: randomly added to tests
				CameraReplyBytes(MaskMismatchResponseBytes), // zoom-position
				InquiryFailed(
					[InquiryResponseIncompatibleMatcher, MatchVISCABytes(MaskMismatchResponseBytes), UserDefinedInquiryMatcher],
					'zoom-position'
				),
			],
			InstanceStatus.Ok
		)
	})

	test('actual response longer, module-defined inquiry', async () => {
		const TooLongResponseBytes = [0x90, 0x50, 0x01, 0x02, 0x03, 0x04, 0x05, 0xff]
		return RunCameraInteractionTest(
			[
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				CameraExpectIncomingBytes(ExposureModeInquiryBytes), // exposure-mode
				CameraReplyBytes(TooLongResponseBytes), // exposure-mode
				InquiryFailed(
					[InquiryResponseIncompatibleMatcher, MatchVISCABytes(TooLongResponseBytes), BlameModuleMatcher],
					'exposure-mode'
				),
			],
			InstanceStatus.Ok
		)
	})

	test('actual response mask mismatch, module-defined inquiry', async () => {
		const MaskMismatchResponseBytes = [0x90, 0x50, 0x22, 0xff]
		return RunCameraInteractionTest(
			[
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				CameraExpectIncomingBytes(ExposureModeInquiryBytes), // exposure-mode
				CameraReplyBytes(MaskMismatchResponseBytes), // exposure-mode
				InquiryFailed(
					[InquiryResponseIncompatibleMatcher, MatchVISCABytes(MaskMismatchResponseBytes), BlameModuleMatcher],
					'exposure-mode'
				),
			],
			InstanceStatus.Ok
		)
	})
})
