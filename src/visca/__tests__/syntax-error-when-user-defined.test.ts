import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { UserDefinedCommand, UserDefinedInquiry } from '../command.js'
import { SyntaxErrorBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CommandFailed,
	InquiryFailed,
	SendCommand,
	SendInquiry,
} from './camera-interactions/interactions.js'
import {
	CameraReportedSyntaxErrorMatcher,
	MatchVISCABytes,
	UserDefinedMessageMatcher,
} from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('syntax error in user-defined message', () => {
	test('syntax error in user-defined command', async () => {
		const ResetSharpnessBytes = [0x81, 0x01, 0x04, 0x02, 0x00, 0xff]
		const ResetSharpness = new UserDefinedCommand(ResetSharpnessBytes)

		return RunCameraInteractionTest(
			[
				SendCommand(ResetSharpness, 'reset-sharpness'),
				CameraExpectIncomingBytes(ResetSharpnessBytes), // reset-sharpness
				CameraReplyBytes(SyntaxErrorBytes), // reset-sharpness
				CommandFailed(
					[CameraReportedSyntaxErrorMatcher, MatchVISCABytes(ResetSharpnessBytes), UserDefinedMessageMatcher],
					'reset-sharpness',
				),
			],
			InstanceStatus.Ok,
		)
	})

	test('syntax error in user-defined inquiry', async () => {
		const ABCDInquiryBytes = [0x81, 0x0a, 0x0b, 0x0c, 0x0d, 0xff]
		const ABCDInquiry = new UserDefinedInquiry(ABCDInquiryBytes, {
			value: [0x90, 0x50, 0x00, 0xff],
			mask: [0xff, 0xff, 0xf0, 0xff],
			params: {
				p: {
					nibbles: [5],
					paramToChoice: String,
				},
			},
		})

		return RunCameraInteractionTest(
			[
				SendInquiry(ABCDInquiry, 'ABCD'),
				CameraExpectIncomingBytes(ABCDInquiryBytes), // ABCD
				CameraReplyBytes(SyntaxErrorBytes), // ABCD
				InquiryFailed(
					[CameraReportedSyntaxErrorMatcher, MatchVISCABytes(ABCDInquiryBytes), UserDefinedMessageMatcher],
					'ABCD',
				),
			],
			InstanceStatus.Ok,
		)
	})
})
