import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { PresetRecall } from '../../camera/commands.js'
import { FocusModeInquiry } from '../../camera/inquiries.js'
import { PresetRecallOption } from '../../camera/options.js'
import { ACK, Completion, FocusModeInquiryBytes, PresetRecallBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CommandSucceeded,
	InquirySucceeded,
	SendCommand,
	SendInquiry,
} from './camera-interactions/interactions.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('ACK/Completion interleaving', () => {
	test('two presets in succession', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(PresetRecall, { [PresetRecallOption.id]: '01' }, 'preset-1'),
				SendCommand(PresetRecall, { [PresetRecallOption.id]: '05' }, 'preset-5'),
				CameraExpectIncomingBytes(PresetRecallBytes(1)), // preset-1
				CameraExpectIncomingBytes(PresetRecallBytes(5)), // preset-5
				CameraReplyBytes(ACK(1)), // preset-1
				CameraReplyBytes(ACK(2)), // preset-5
				CameraReplyBytes(Completion(1)), // preset-1
				CommandSucceeded('preset-1'),
				CameraReplyBytes(Completion(2)), // preset-5
				CommandSucceeded('preset-5'),
			],
			InstanceStatus.Ok,
		)
	})

	test('two presets with inquiry in between', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(PresetRecall, { [PresetRecallOption.id]: '01' }, 'preset-1'),
				SendInquiry(FocusModeInquiry, 'focus-mode'),
				SendCommand(PresetRecall, { [PresetRecallOption.id]: '05' }, 'preset-5'),
				CameraExpectIncomingBytes(PresetRecallBytes(1)), // preset-1
				CameraExpectIncomingBytes(FocusModeInquiryBytes), // focus-mode
				CameraExpectIncomingBytes(PresetRecallBytes(5)), // preset-5
				CameraReplyBytes(ACK(1)), // preset-1
				CameraReplyBytes(ACK(2)), // preset-5
				CameraReplyBytes([0x90, 0x50, 0x03, 0xff]), // focus-mode
				InquirySucceeded({ bol: '1' }, 'focus-mode'),
				CameraReplyBytes(Completion(1)), // preset-1
				CommandSucceeded('preset-1'),
				CameraReplyBytes(Completion(2)), // preset-5
				CommandSucceeded('preset-5'),
			],
			InstanceStatus.Ok,
		)
	})
})
