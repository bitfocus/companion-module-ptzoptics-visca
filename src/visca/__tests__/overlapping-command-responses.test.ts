import { InstanceStatus } from '@companion-module/base'
import { describe, test } from 'vitest'
import { FocusModeInquiry } from '../../camera/focus.js'
import { PresetRecall } from '../../camera/presets.js'
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
				SendCommand(PresetRecall, { preset: 1 }, 'preset-1'),
				SendCommand(PresetRecall, { preset: 5 }, 'preset-5'),
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
				SendCommand(PresetRecall, { preset: 1 }, 'preset-1'),
				SendInquiry(FocusModeInquiry, 'focus-mode'),
				SendCommand(PresetRecall, { preset: 5 }, 'preset-5'),
				CameraExpectIncomingBytes(PresetRecallBytes(1)), // preset-1
				CameraExpectIncomingBytes(FocusModeInquiryBytes), // focus-mode
				CameraExpectIncomingBytes(PresetRecallBytes(5)), // preset-5
				CameraReplyBytes(ACK(1)), // preset-1
				CameraReplyBytes(ACK(2)), // preset-5
				CameraReplyBytes([0x90, 0x50, 0x03, 0xff]), // focus-mode
				InquirySucceeded({ mode: 'manual' }, 'focus-mode'),
				CameraReplyBytes(Completion(1)), // preset-1
				CommandSucceeded('preset-1'),
				CameraReplyBytes(Completion(2)), // preset-5
				CommandSucceeded('preset-5'),
			],
			InstanceStatus.Ok,
		)
	})
})
