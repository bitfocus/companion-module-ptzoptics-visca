import { InstanceStatus } from '@companion-module/base'
import { describe, test } from 'vitest'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	InquirySucceeded,
	SendInquiry,
} from './camera-interactions/interactions.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'
import { ModuleDefinedInquiry } from '../inquiry.js'

describe('inquiry answer parameter conversions', () => {
	test('answer with no parameters', async () => {
		const AnswerBytes = [0x90, 0x50, 0x02, 0xff] as const
		const NoParamsInquiry = new ModuleDefinedInquiry([0x81, 0x12, 0xff], {
			bytes: AnswerBytes,
			params: {},
		})

		return RunCameraInteractionTest(
			[
				SendInquiry(NoParamsInquiry, 'inq-1'),
				CameraExpectIncomingBytes([0x81, 0x12, 0xff]), // inq-1
				SendInquiry(NoParamsInquiry, 'inq-2'),
				CameraExpectIncomingBytes([0x81, 0x12, 0xff]), // inq-2
				CameraReplyBytes(AnswerBytes), // inq-1
				InquirySucceeded({}, 'inq-1'),
				CameraReplyBytes(AnswerBytes), // inq-2
				InquirySucceeded({}, 'inq-2'),
			],
			InstanceStatus.Ok,
		)
	})

	test('answer with one parameter and no conversion', async () => {
		const OneNonConvertingParamInquiry = new ModuleDefinedInquiry([0x81, 0x35, 0x77, 0xff], {
			bytes: [0x90, 0x50, 0x00, 0x00, 0x00, 0xff],
			params: {
				height: {
					nibbles: [9, 5, 7],
				},
			},
		})

		return RunCameraInteractionTest(
			[
				SendInquiry(OneNonConvertingParamInquiry, 'inq-1'),
				CameraExpectIncomingBytes([0x81, 0x35, 0x77, 0xff]), // inq-1
				SendInquiry(OneNonConvertingParamInquiry, 'inq-2'),
				CameraReplyBytes([0x90, 0x50, 0x07, 0x03, 0x05, 0xff]), // inq-1
				CameraExpectIncomingBytes([0x81, 0x35, 0x77, 0xff]), // inq-2
				InquirySucceeded({ height: 0x573 }, 'inq-1'),
				CameraReplyBytes([0x90, 0x50, 0x01, 0x02, 0x04, 0xff]), // inq-2
				InquirySucceeded({ height: 0x412 }, 'inq-2'),
			],
			InstanceStatus.Ok,
		)
	})

	test('answer with one parameter and conversion to limited type', async () => {
		type FlipState = 'unflipped' | 'flipped'
		const TableFlip = new ModuleDefinedInquiry([0x81, 0x09, 0x04, 0x66, 0xff], {
			bytes: [0x90, 0x50, 0x00, 0xff],
			params: {
				state: {
					nibbles: [5],
					convert: (param: number): FlipState => {
						switch (param) {
							case 0x2:
								return 'flipped'
							case 0x3:
								return 'unflipped'
							default:
								return 'BAD' as FlipState
						}
					},
				},
			},
		})

		return RunCameraInteractionTest(
			[
				SendInquiry(TableFlip, 'inq-1'),
				CameraExpectIncomingBytes([0x81, 0x09, 0x04, 0x66, 0xff]), // inq-1
				SendInquiry(TableFlip, 'inq-2'),
				CameraExpectIncomingBytes([0x81, 0x09, 0x04, 0x66, 0xff]), // inq-1
				CameraReplyBytes([0x90, 0x50, 0x02, 0xff]), // inq-1
				InquirySucceeded({ state: 'flipped' }, 'inq-1'),
				SendInquiry(TableFlip, 'inq-3'),
				CameraReplyBytes([0x90, 0x50, 0x03, 0xff]), // inq-2
				CameraExpectIncomingBytes([0x81, 0x09, 0x04, 0x66, 0xff]), // inq-3
				CameraReplyBytes([0x90, 0x50, 0x09, 0xff]), // inq-2
				InquirySucceeded({ state: 'unflipped' }, 'inq-2'),
				InquirySucceeded({ state: 'BAD' }, 'inq-3'),
			],
			InstanceStatus.Ok,
		)
	})

	test('answer with mixture of conversions', async () => {
		type FocusMode = 'auto' | 'manual'

		const BlockLensInquiry = new ModuleDefinedInquiry([0x81, 0x09, 0x7e, 0x7e, 0x00, 0xff], {
			bytes: [0x90, 0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff],
			params: {
				zoomPos: {
					nibbles: [5, 7, 9, 11],
				},
				focusPos: {
					nibbles: [17, 19, 21, 23],
				},
				focusMode: {
					// Technically this command is documented as
					// "w.bit0: Focus mode 1: Auto, 0: Manual".  We could allow
					// targeting nibbles *or* exact bits *or* nibbles, but no
					// demanded inquiries use bits, so for a test we'll be lazy.
					nibbles: [27],
					convert: (param: number): FocusMode => {
						return (param & 0x1) === 0 ? 'manual' : 'auto'
					},
				},
			},
		})

		return RunCameraInteractionTest(
			[
				SendInquiry(BlockLensInquiry, 'inq-1'),
				CameraExpectIncomingBytes([0x81, 0x09, 0x7e, 0x7e, 0x00, 0xff]), // inq-1
				CameraReplyBytes([
					0x90, 0x50, 0x06, 0x02, 0x08, 0x04, 0x00, 0x00, 0x01, 0x03, 0x05, 0x09, 0x00, 0x03, 0x00, 0xff,
				]), // inq-1
				SendInquiry(BlockLensInquiry, 'inq-2'),
				InquirySucceeded({ zoomPos: 0x6284, focusPos: 0x1359, focusMode: 'auto' }, 'inq-1'),
				CameraExpectIncomingBytes([0x81, 0x09, 0x7e, 0x7e, 0x00, 0xff]), // inq-2
				CameraReplyBytes([
					0x90, 0x50, 0x01, 0x02, 0x04, 0x07, 0x00, 0x00, 0x03, 0x04, 0x09, 0x01, 0x00, 0x04, 0x00, 0xff,
				]), // inq-2
				InquirySucceeded({ zoomPos: 0x1247, focusPos: 0x3491, focusMode: 'manual' }, 'inq-2'),
			],
			InstanceStatus.Ok,
		)
	})
})
