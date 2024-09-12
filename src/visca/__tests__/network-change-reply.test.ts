import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CameraReplyNetworkChange,
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

describe('network change reply', () => {
	test('network change reply followed by command', async () => {
		return RunCameraInteractionTest(
			[
				InstanceStatusIs(InstanceStatus.Connecting),
				CameraReplyNetworkChange([0x80, 0x38, 0xff]),
				SendCommand(OnScreenDisplayClose, 'osd-close'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // osd-close
				CameraReplyBytes(ACKCompletion(1)), // osd-close
				CommandSucceeded('osd-close'),
			],
			InstanceStatus.Ok,
		)
	})

	test('network change reply followed by inquiry', async () => {
		return RunCameraInteractionTest(
			[
				InstanceStatusIs(InstanceStatus.Connecting),
				// 90 is specially worth testing because 90 ... FF is the format
				// of basic camera responses and inquiry responses -- it's just
				// that none of those responses are ever 90 38 FF.
				CameraReplyNetworkChange([0x90, 0x38, 0xff]),
				SendInquiry(OnScreenDisplayInquiry, 'osd-inquiry'),
				CameraExpectIncomingBytes(OnScreenDisplayInquiryBytes), // osd-inquiry
				CameraReplyBytes([0x90, 0x50, 0x02, 0xff]), // osd-inquiry
				InquirySucceeded({ state: 'open' }, 'osd-inquiry'),
			],
			InstanceStatus.Ok,
		)
	})

	test('network change reply not at start, followed by command', async () => {
		return RunCameraInteractionTest(
			[
				InstanceStatusIs(InstanceStatus.Connecting),
				SendCommand(OnScreenDisplayClose, 'osd-close-before'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // osd-close-before
				CameraReplyBytes(ACKCompletion(1)), // osd-close-before
				CommandSucceeded('osd-close-before'),
				CameraReplyNetworkChange([0xc0, 0x38, 0xff]),
				SendCommand(OnScreenDisplayClose, 'osd-close-after'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // osd-close-after
				CameraReplyBytes(ACKCompletion(2)), // osd-close-after
				CommandSucceeded('osd-close-after'),
			],
			InstanceStatus.Ok,
		)
	})

	test('network change reply not at start, followed by inquiry', async () => {
		return RunCameraInteractionTest(
			[
				InstanceStatusIs(InstanceStatus.Connecting),
				SendInquiry(OnScreenDisplayInquiry, 'osd-inquiry-before'),
				CameraExpectIncomingBytes(OnScreenDisplayInquiryBytes), // osd-inquiry-before
				CameraReplyBytes([0x90, 0x50, 0x02, 0xff]), // osd-inquiry-before
				InquirySucceeded({ state: 'open' }, 'osd-inquiry-before'),
				CameraReplyNetworkChange([0xd0, 0x38, 0xff]),
				SendInquiry(OnScreenDisplayInquiry, 'osd-inquiry-after'),
				CameraExpectIncomingBytes(OnScreenDisplayInquiryBytes), // osd-inquiry-after
				CameraReplyBytes([0x90, 0x50, 0x02, 0xff]), // osd-inquiry-after
				InquirySucceeded({ state: 'open' }, 'osd-inquiry-after'),
			],
			InstanceStatus.Ok,
		)
	})

	// We could test a network change reply on its own with no other
	// interactions, but 1) it's kind of pointless because it's not how people
	// will want to use the module, 2) to properly test it we'd need to have
	// VISCAPort expose that it's received and parsed through a reply that we're
	// deliberately hiding, and 3) it's not relevant to PTZOptics cameras so
	// it's hard to justify the special effort.
})
