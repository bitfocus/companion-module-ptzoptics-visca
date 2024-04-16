import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import {
	FocusFarStandard,
	FocusNearStandard,
	FocusStop,
	OnScreenDisplayClose,
	PresetRecall,
} from '../camera/commands.js'
import { RunCameraInteractionTest } from '../__tests__/camera-interaction.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CommandFailed,
	CommandSucceeded,
	SendCommand,
} from '../__tests__/interactions.js'
import {
	ACK,
	ACKCompletion,
	Completion,
	FocusFarStandardBytes,
	FocusNearStandardBytes,
	FocusStopBytes,
	OnScreenDisplayCloseBytes,
	PresetRecallBytes,
} from '../__tests__/interaction-bytes.js'
import { CantBeExecutedNowMatcher } from '../__tests__/interaction-matchers.js'

function CommandNotExecutable(y: number): [number, number, number, number] {
	if (0x0 <= y && y <= 0xf) {
		return [0x90, 0x60 + y, 0x41, 0xff]
	}

	throw new Error(`Invalid socket number passed to CommandNotExecutable: ${y}`)
}

// This interaction sequence comes from good old real-world button-mashing.  It
// is therefore more...hectic 🤪 than other VISCAPort tests.
describe('completion in empty socket', () => {
	test('completion in never-used socket', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'osd-close-1'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // osd-close-1
				SendCommand(PresetRecall, { val: '04' }, 'preset-recall-2'),
				CameraExpectIncomingBytes(PresetRecallBytes(4)), // preset-recall-2
				CameraReplyBytes(ACKCompletion(1)), // osd-close-1
				CommandSucceeded('osd-close-1'),
				SendCommand(OnScreenDisplayClose, 'osd-close-3'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // osd-close-3
				SendCommand(PresetRecall, { val: '01' }, 'preset-recall-4'),
				CameraExpectIncomingBytes(PresetRecallBytes(1)), // preset-recall-4
				SendCommand(OnScreenDisplayClose, 'osd-close-5'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // osd-close-5
				SendCommand(PresetRecall, { val: '03' }, 'preset-recall-6'),
				CameraExpectIncomingBytes(PresetRecallBytes(3)), // preset-recall-6
				SendCommand(OnScreenDisplayClose, 'osd-close-7'),
				CameraExpectIncomingBytes(OnScreenDisplayCloseBytes), // osd-close-7
				SendCommand(PresetRecall, { val: '02' }, 'preset-recall-8'),
				CameraExpectIncomingBytes(PresetRecallBytes(2)), // preset-recall-8
				CameraReplyBytes(ACK(2)), // preset-recall-2
				CameraReplyBytes(ACKCompletion(1)), // osd-close-3
				CommandSucceeded('osd-close-3'),
				SendCommand(FocusNearStandard, 'focus-near-standard-9'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near-standard-9
				SendCommand(FocusStop, 'focus-stop-10'),
				CameraExpectIncomingBytes(FocusStopBytes), // focus-stop-10
				CameraReplyBytes(Completion(2)), // preset-recall-2
				CommandSucceeded('preset-recall-2'),
				CameraReplyBytes(ACK(2)), // preset-recall-4
				CameraReplyBytes(ACKCompletion(1)), // osd-close-5
				CommandSucceeded('osd-close-5'),
				SendCommand(FocusFarStandard, 'focus-far-standard-11'),
				CameraExpectIncomingBytes(FocusFarStandardBytes), // focus-far-standard-11
				SendCommand(FocusStop, 'focus-stop-12'),
				CameraExpectIncomingBytes(FocusStopBytes), // focus-stop-12
				SendCommand(FocusNearStandard, 'focus-near-standard-13'),
				CameraExpectIncomingBytes(FocusNearStandardBytes), // focus-near-standard-13
				SendCommand(FocusStop, 'focus-stop-14'),
				CameraExpectIncomingBytes(FocusStopBytes), // focus-stop-14
				CameraReplyBytes(Completion(2)), // preset-recall-4
				CommandSucceeded('preset-recall-4'),
				CameraReplyBytes(ACK(2)), // preset-recall-6
				CameraReplyBytes(ACKCompletion(1)), // osd-close-7
				CommandSucceeded('osd-close-7'),
				CameraReplyBytes(Completion(2)), // preset-recall-6
				CommandSucceeded('preset-recall-6'),
				CameraReplyBytes(ACK(2)), // preset-recall-8
				CameraReplyBytes(CommandNotExecutable(1)), // focus-near-standard-9
				CommandFailed(CantBeExecutedNowMatcher, 'focus-near-standard-9'),
				CameraReplyBytes(CommandNotExecutable(2)), // focus-stop-10
				CommandFailed(CantBeExecutedNowMatcher, 'focus-stop-10'),
				CameraReplyBytes(CommandNotExecutable(1)), // focus-far-standard-11
				CommandFailed(CantBeExecutedNowMatcher, 'focus-far-standard-11'),
				CameraReplyBytes(CommandNotExecutable(2)), // focus-stop-12
				CommandFailed(CantBeExecutedNowMatcher, 'focus-stop-12'),
				CameraReplyBytes(CommandNotExecutable(1)), // focus-near-standard-13
				CommandFailed(CantBeExecutedNowMatcher, 'focus-near-standard-13'),
				CameraReplyBytes(CommandNotExecutable(2)), // focus-stop-14
				CommandFailed(CantBeExecutedNowMatcher, 'focus-stop-14'),
				CameraReplyBytes(Completion(2)), // preset-recall-8
				CommandSucceeded('preset-recall-8'),
			],
			InstanceStatus.Ok
		)
	})
})
