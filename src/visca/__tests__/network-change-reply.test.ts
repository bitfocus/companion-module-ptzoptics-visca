import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import {
	CameraExpectIncomingBytes,
	CameraInitialNetworkChangeReply,
	CameraReplyBytes,
	CommandSucceeded,
	InquirySucceeded,
	InstanceStatusIs,
	SendCommand,
	SendInquiry,
} from './camera-interactions/interactions.js'
import { ACKCompletion, OnScreenDisplayCloseBytes, OnScreenDisplayInquiryBytes } from './camera-interactions/bytes.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'
import { OnScreenDisplayClose } from '../../camera/commands.js'
import { OnScreenDisplayInquiry } from '../../camera/inquiries.js'

describe('ignore initial network change reply', () => {
	test('network change reply followed by command', async () => {
		return RunCameraInteractionTest(
			[
				InstanceStatusIs(InstanceStatus.Connecting),
				CameraInitialNetworkChangeReply([0x80, 0x38, 0xff]),
				SendCommand(OnScreenDisplayClose, 'osd-close'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // osd-close
				CameraReplyBytes(ACKCompletion(1)), // osd-close
				CommandSucceeded('osd-close'),
			],
			InstanceStatus.Ok
		)
	})

	test('network change reply followed by inquiry', async () => {
		return RunCameraInteractionTest(
			[
				InstanceStatusIs(InstanceStatus.Connecting),
				// 90 is specially worth testing because 90 ... FF is the format
				// of basic camera responses and inquiry responses -- it's just
				// that none of those responses are ever 90 38 FF.
				CameraInitialNetworkChangeReply([0x90, 0x38, 0xff]),
				SendInquiry(OnScreenDisplayInquiry, 'osd-inquiry'),
				CameraExpectIncomingBytes(OnScreenDisplayInquiryBytes), // osd-inquiry
				CameraReplyBytes([0x90, 0x50, 0x02, 0xff]), // osd-inquiry
				InquirySucceeded({ state: 'open' }, 'osd-inquiry'),
			],
			InstanceStatus.Ok
		)
	})

	// We could test a network change reply on its own with no other
	// interactions, but 1) it's kind of pointless because nobody wants to do
	// that, 2) to properly test it we'd need to have VISCAPort notify that it's
	// received and parsed through a reply that we're deliberately hiding, and
	// 3) it's not relevant to PTZOptics cameras so it's hard to justify the
	// effort.
})
