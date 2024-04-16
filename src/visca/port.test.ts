import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import {
	CameraPower,
	FocusLock,
	FocusNearStandard,
	FocusStop,
	OnScreenDisplayClose,
	OnScreenDisplayToggle,
	PanTiltHome,
	PresetRecall,
} from '../camera/commands.js'
import { ExposureModeInquiry, FocusModeInquiry, OnScreenDisplayInquiry } from '../camera/inquiries.js'
import { PresetRecallOption } from '../camera/options.js'
import { UserDefinedCommand, UserDefinedInquiry } from './command.js'
import { RunCameraInteractionTest } from '../__tests__/camera-interaction.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CloseVISCAPortEarly,
	CommandFailed,
	CommandFailedFatally,
	CommandSucceeded,
	InquiryFailed,
	InquiryFailedFatally,
	InquirySucceeded,
	InstanceStatusIs,
	SendCommand,
	SendInquiry,
} from '../__tests__/interactions.js'
import {
	ACK,
	ACKCompletion,
	CommandNotExecutable,
	Completion,
	PresetRecallBytes,
} from '../__tests__/interaction-bytes.js'
import {
	BlameModuleMatcher,
	CantBeExecutedNowMatcher,
	CompletionInEmptySocketMatcher,
	NotExecutableWithNoCommandsAwaitingInitialResponseMatcher,
} from '../__tests__/interaction-matchers.js'

const CommandBufferFull = [0x90, 0x60, 0x03, 0xff]
const SyntaxError = [0x90, 0x60, 0x02, 0xff]

const FocusModeInquiryBytes = [0x81, 0x09, 0x04, 0x38, 0xff]

const CameraReportedSyntaxErrorMatcher = /^Camera reported a syntax error in the message/
const BadReturnMessageMatcher =
	/^Error in camera response: return message data doesn't start with 0x90 \(VISCA bytes \[[0-9A-Z]{2}(?: [0-9A-Z]{2})*\]\)$/
const BadACKMatcher =
	/^Received malformed ACK, closing connection to avoid send\/receive decoherence \(VISCA bytes \[[0-9A-Z]{2}(?: [0-9A-Z]{2})*\]\)$/
const SocketClosedMatcher = 'Message not fully processed: socket was closed'

const UserDefinedInquiryMatcher = /Double-check the syntax of your inquiry./
const UserDefinedMessageMatcher = /Double-check the syntax of the message./

const UnrecognizedErrorMatcher = /^Received error response to \[[0-9A-Z ]+\] with unrecognized format/

const UnrecognizedFormatMatcher = /^Received response with unrecognized format/

const AttemptSendInvalidMatcher = /^Attempt to send invalid /

describe('VISCA port sending/receiving basics', () => {
	test('simple command succeeding', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'osd-close'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x06, 0x06, 0x03, 0xff]), // osd-close
				CameraReplyBytes(ACKCompletion(1)), // osd-close
				CommandSucceeded('osd-close'),
			],
			InstanceStatus.Ok
		)
	})

	test('simple command failing', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'osd-close'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x06, 0x06, 0x03, 0xff]), // osd-close
				CameraReplyBytes(SyntaxError),
				CommandFailed([CameraReportedSyntaxErrorMatcher, BlameModuleMatcher], 'osd-close'),
			],
			InstanceStatus.Ok
		)
	})

	test('simple inquiry succeeding', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(OnScreenDisplayInquiry, 'osd-inquiry'),
				CameraExpectIncomingBytes([0x81, 0x09, 0x06, 0x06, 0xff]), // osd-inquiry
				CameraReplyBytes([0x90, 0x50, 0x02, 0xff]), // osd-inquiry
				InquirySucceeded({ state: 'open' }, 'osd-inquiry'),
			],
			InstanceStatus.Ok
		)
	})

	test('simple inquiry failing', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(OnScreenDisplayInquiry, 'osd-inquiry'),
				CameraExpectIncomingBytes([0x81, 0x09, 0x06, 0x06, 0xff]), // osd-inquiry
				CameraReplyBytes(SyntaxError), // osd-inquiry
				InquiryFailed([CameraReportedSyntaxErrorMatcher, BlameModuleMatcher], 'osd-inquiry'),
			],
			InstanceStatus.Ok
		)
	})
})

describe('VISCA port command not executable', () => {
	test('command not executable', async () => {
		// This sequence can happen when the camera is in auto focus mode.
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // focus-near
				CameraReplyBytes(CommandNotExecutable(0xf)), // focus-near
				CommandFailed(CantBeExecutedNowMatcher, 'focus-near'),
			],
			InstanceStatus.Ok
		)
	})
})

describe('VISCA return message syntax errors', () => {
	test('return message bad start byte FF', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // focus-near
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes([0xff]), // focus-near
				CommandFailedFatally(BadReturnMessageMatcher, 'focus-near'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('return message bad start byte 42', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // focus-near
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes([0x42]), // focus-near
				CommandFailedFatally(BadReturnMessageMatcher, 'focus-near'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('bad start byte with pending commands', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				SendCommand(FocusStop, 'stop'),
				SendCommand(FocusLock, 'lock'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // focus-near
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x00, 0xff]), // stop
				CameraExpectIncomingBytes([0x81, 0x0a, 0x04, 0x68, 0x02, 0xff]), // lock
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes([0x42]), // focus-near
				CommandFailedFatally(BadReturnMessageMatcher, 'focus-near'),
				InstanceStatusIs(InstanceStatus.ConnectionFailure),
				CommandFailedFatally(BadReturnMessageMatcher, 'stop'),
				CommandFailedFatally(BadReturnMessageMatcher, 'lock'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('bad start byte with pending inquiries', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'near'),
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				SendInquiry(FocusModeInquiry, 'focus-mode'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // near
				CameraExpectIncomingBytes([0x81, 0x09, 0x04, 0x39, 0xff]), // exposure-mode
				CameraExpectIncomingBytes(FocusModeInquiryBytes), // focus-mode
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes([0x42]), // near
				CommandFailedFatally(BadReturnMessageMatcher, 'near'),
				InstanceStatusIs(InstanceStatus.ConnectionFailure),
				InquiryFailedFatally(BadReturnMessageMatcher, 'exposure-mode'),
				InquiryFailedFatally(BadReturnMessageMatcher, 'focus-mode'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('bad start byte with pending commands *and* inquiries', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'near'),
				SendCommand(FocusLock, 'lock'),
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				SendInquiry(FocusModeInquiry, 'focus-mode'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // near
				CameraExpectIncomingBytes([0x81, 0x0a, 0x04, 0x68, 0x02, 0xff]), // lock
				CameraExpectIncomingBytes([0x81, 0x09, 0x04, 0x39, 0xff]), // exposure-mode
				CameraExpectIncomingBytes(FocusModeInquiryBytes), // focus-mode
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes([0x42]), // near
				CommandFailedFatally(BadReturnMessageMatcher, 'near'),
				CommandFailedFatally(BadReturnMessageMatcher, 'lock'),
				InstanceStatusIs(InstanceStatus.ConnectionFailure),
				InquiryFailedFatally(BadReturnMessageMatcher, 'exposure-mode'),
				InquiryFailedFatally(BadReturnMessageMatcher, 'focus-mode'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('bad start byte with half-pending command', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				SendCommand(FocusStop, 'focus-stop'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // focus-near
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x00, 0xff]), // focus-stop
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes(ACK(2)), // focus-near
				CameraReplyBytes([0x42]), // focus-stop *or* a botched Completion(2)
				CommandFailedFatally(BadReturnMessageMatcher, 'focus-near'),
				InstanceStatusIs(InstanceStatus.ConnectionFailure),
				CommandFailedFatally(BadReturnMessageMatcher, 'focus-stop'),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})

describe('VISCA ACK syntax errors', () => {
	test('return message bad start byte FF', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // focus-near
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes([0x90, 0x40, 0x33, 0xff]), // ACK but extra 33 byte to focus-near
				CommandFailedFatally(BadACKMatcher, 'focus-near'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('return message bad start byte 42', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // focus-near
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes([0x42]), // focus-near
				CommandFailedFatally(BadReturnMessageMatcher, 'focus-near'),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})

describe('VISCA port closed early', () => {
	test('manual close with commands waiting for initial response *and* completion', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				SendCommand(FocusStop, 'focus-stop'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // focus-near
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x00, 0xff]), // focus-stop
				CameraReplyBytes(ACK(2)), // focus-near
				CloseVISCAPortEarly(),
				InstanceStatusIs(InstanceStatus.Disconnected),
				CommandFailedFatally(SocketClosedMatcher, 'focus-near'),
				CommandFailedFatally(SocketClosedMatcher, 'focus-stop'),
			],
			InstanceStatus.Disconnected
		)
	})

	test('manual close with half-completed command and inquiry waiting for initial response', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // focus-near
				CameraExpectIncomingBytes([0x81, 0x09, 0x04, 0x39, 0xff]), // exposure-mode
				CameraReplyBytes(ACK(2)), // focus-near
				CloseVISCAPortEarly(),
				InstanceStatusIs(InstanceStatus.Disconnected),
				CommandFailedFatally(SocketClosedMatcher, 'focus-near'),
				InquiryFailedFatally(SocketClosedMatcher, 'exposure-mode'),
			],
			InstanceStatus.Disconnected
		)
	})
})

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
			InstanceStatus.Ok
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
			InstanceStatus.Ok
		)
	})
})

describe('ACK without pending command', () => {
	test('ACK with only inquiry pending', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(FocusModeInquiry, 'focus-mode'),
				CameraExpectIncomingBytes(FocusModeInquiryBytes), // focus-mode
				CameraReplyBytes(ACK(1)), // focus-mode
				InquiryFailedFatally([/^Received ACK without a pending command/, /\[90 41 FF\]/], 'focus-mode'),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})

describe('multiple ACKs in same socket', () => {
	test('two in same socket', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(CameraPower, { bool: 'on' }, 'camera-power'),
				SendCommand(FocusLock, 'focus-lock'),
				SendCommand(PanTiltHome, 'ptz-home'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x00, 0x02, 0xff]), // camera-power
				CameraReplyBytes(ACK(1)), // camera-power
				CameraExpectIncomingBytes([0x81, 0x0a, 0x04, 0x68, 0x02, 0xff]), // focus-lock
				CameraExpectIncomingBytes([0x81, 0x01, 0x06, 0x04, 0xff]), // ptz-home
				CameraReplyBytes(ACK(2)), // focus-lock
				CameraReplyBytes(ACK(1)), // ptz-home
				CameraReplyBytes(Completion(1)), // camera-power
				CommandSucceeded('camera-power'),
				CameraReplyBytes(Completion(2)), // focus-lock
				CommandSucceeded('focus-lock'),
				CameraReplyBytes(Completion(1)), // ptz-home
				CommandSucceeded('ptz-home'),
			],
			InstanceStatus.Ok
		)
	})

	test('two in same socket, out of order', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(CameraPower, { bool: 'on' }, 'camera-power'),
				SendCommand(FocusLock, 'focus-lock'),
				SendCommand(PanTiltHome, 'ptz-home'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x00, 0x02, 0xff]), // camera-power
				CameraReplyBytes(ACK(1)), // camera-power
				CameraExpectIncomingBytes([0x81, 0x0a, 0x04, 0x68, 0x02, 0xff]), // focus-lock
				CameraExpectIncomingBytes([0x81, 0x01, 0x06, 0x04, 0xff]), // ptz-home
				CameraReplyBytes(ACK(2)), // focus-lock
				CameraReplyBytes(ACK(1)), // ptz-home
				CameraReplyBytes(Completion(1)), // camera-power
				CommandSucceeded('camera-power'),
				CameraReplyBytes(Completion(1)), // ptz-home (out of order!)
				CommandSucceeded('ptz-home'),
				CameraReplyBytes(Completion(2)), // focus-lock
				CommandSucceeded('focus-lock'),
			],
			InstanceStatus.Ok
		)
	})
})

describe('completion in empty socket', () => {
	test('completion in never-used socket', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(CameraPower, { bool: 'on' }, 'camera-power'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x00, 0x02, 0xff]), // camera-power
				CameraReplyBytes(Completion(1)), // camera-power
				CommandFailedFatally(CompletionInEmptySocketMatcher(1), 'camera-power'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('completion in never-used socket with prior command', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(CameraPower, { bool: 'on' }, 'camera-power'),
				SendCommand(FocusLock, 'focus-lock'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x00, 0x02, 0xff]), // camera-power
				CameraExpectIncomingBytes([0x81, 0x0a, 0x04, 0x68, 0x02, 0xff]), // focus-lock
				CameraReplyBytes(ACKCompletion(1)), // camera-power
				CommandSucceeded('camera-power'),
				CameraReplyBytes(Completion(2)), // focus-lock
				CommandFailedFatally(CompletionInEmptySocketMatcher(2), 'focus-lock'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('completion in used-but-emptied socket', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(CameraPower, { bool: 'on' }, 'camera-power'),
				SendCommand(FocusLock, 'focus-lock'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x00, 0x02, 0xff]), // camera-power
				CameraReplyBytes(ACKCompletion(1)), // camera-power
				CommandSucceeded('camera-power'),
				CameraExpectIncomingBytes([0x81, 0x0a, 0x04, 0x68, 0x02, 0xff]), // focus-lock
				CameraReplyBytes(Completion(1)), // focus-lock
				CommandFailedFatally(CompletionInEmptySocketMatcher(1), 'focus-lock'),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})

describe('no pending inquiry', () => {
	test('inquiry response with command waiting initial response', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusLock, 'focus-lock'),
				CameraExpectIncomingBytes([0x81, 0x0a, 0x04, 0x68, 0x02, 0xff]), // focus-lock
				CameraReplyBytes([0x90, 0x50, 0x37 /* makes it an inquiry response */, 0xff]),
				CommandFailedFatally([/^Received inquiry response without a pending inquiry/, /\[90 50 37 FF\]/], 'focus-lock'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('inquiry response with command waiting initial response, past inquiry', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusLock, 'focus-lock'),
				SendInquiry(FocusModeInquiry, 'focus-mode'),
				CameraExpectIncomingBytes([0x81, 0x0a, 0x04, 0x68, 0x02, 0xff]), // focus-lock
				CameraExpectIncomingBytes(FocusModeInquiryBytes), // focus-mode
				CameraReplyBytes([0x90, 0x50, 0x02, 0xff]), // focus-mode
				InquirySucceeded({ bol: '0' }, 'focus-mode'),
				CameraReplyBytes([0x90, 0x50, 0x42 /* makes it an inquiry response */, 0xff]),
				CommandFailedFatally([/^Received inquiry response without a pending inquiry/, /\[90 50 42 FF\]/], 'focus-lock'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('inquiry response with only command waiting for completion', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusLock, 'focus-lock'),
				CameraExpectIncomingBytes([0x81, 0x0a, 0x04, 0x68, 0x02, 0xff]), // focus-lock
				CameraReplyBytes(ACK(1)), // focus-lock
				CameraReplyBytes([0x90, 0x50, 0x17 /* makes it an inquiry response */, 0xff]),
				CommandFailedFatally([/^Received inquiry response without a pending inquiry/, /\[90 50 17 FF\]/], 'focus-lock'),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})

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
		return RunCameraInteractionTest(
			[
				SendInquiry(ZoomPositionInquiry, 'zoom-position'),
				CameraExpectIncomingBytes(ZoomPositionInquiryBytes), // zoom-position
				CameraReplyBytes([0x90, 0x50, 0x09, 0xff]), // zoom-position
				InquiryFailed(
					[/isn't compatible with the expected format/, /\[90 50 09 FF\]/, UserDefinedInquiryMatcher],
					'zoom-position'
				),
			],
			InstanceStatus.Ok
		)
	})

	test('actual response longer, user-defined inquiry', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(ZoomPositionInquiry, 'zoom-position'),
				CameraExpectIncomingBytes(ZoomPositionInquiryBytes), // zoom-position
				CameraReplyBytes([0x90, 0x50, 0x01, 0x02, 0x03, 0x04, 0x05, 0xff]), // zoom-position
				InquiryFailed(
					[/isn't compatible with the expected format/, /\[90 50 01 02 03 04 05 FF\]/, UserDefinedInquiryMatcher],
					'zoom-position'
				),
			],
			InstanceStatus.Ok
		)
	})

	test('actual response mask mismatch, user-defined inquiry', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(ZoomPositionInquiry, 'zoom-position'),
				CameraExpectIncomingBytes(ZoomPositionInquiryBytes), // zoom-position
				CameraReplyBytes([0x90, 0x50, 0xf1, 0x02, 0x03, 0x04, 0xff]), // zoom-position
				InquiryFailed(
					[/isn't compatible with the expected format/, /\[90 50 F1 02 03 04 FF\]/, UserDefinedInquiryMatcher],
					'zoom-position'
				),
			],
			InstanceStatus.Ok
		)
	})

	test('actual response longer, module-defined inquiry', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				CameraExpectIncomingBytes([0x81, 0x09, 0x04, 0x39, 0xff]), // exposure-mode
				CameraReplyBytes([0x90, 0x50, 0x01, 0x02, 0x03, 0x04, 0x05, 0xff]), // exposure-mode
				InquiryFailed(
					[/isn't compatible with the expected format/, /\[90 50 01 02 03 04 05 FF\]/, BlameModuleMatcher],
					'exposure-mode'
				),
			],
			InstanceStatus.Ok
		)
	})

	test('actual response mask mismatch, module-defined inquiry', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				CameraExpectIncomingBytes([0x81, 0x09, 0x04, 0x39, 0xff]), // exposure-mode
				CameraReplyBytes([0x90, 0x50, 0x22, 0xff]), // exposure-mode
				InquiryFailed(
					[/isn't compatible with the expected format/, /\[90 50 22 FF\]/, BlameModuleMatcher],
					'exposure-mode'
				),
			],
			InstanceStatus.Ok
		)
	})
})

describe('too-short error response', () => {
	test('too-short error response to command', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'close'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x06, 0x06, 0x03, 0xff]), // close
				CameraReplyBytes([0x90, 0x60, 0xff]), // close
				CommandFailedFatally([/^Encountered error response of unexpected length/, /\[90 60 FF\]/], 'close'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('too-short error response to inquiry', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				CameraExpectIncomingBytes([0x81, 0x09, 0x04, 0x39, 0xff]), // exposure-mode
				CameraReplyBytes([0x90, 0x60, 0xff]), // exposure-mode
				InquiryFailedFatally([/^Encountered error response of unexpected length/, /\[90 60 FF\]/], 'exposure-mode'),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})

describe('command not executable error', () => {
	test('command not executable, no pending commands', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				CameraExpectIncomingBytes([0x81, 0x09, 0x04, 0x39, 0xff]), // exposure-mode
				CameraReplyBytes(CommandNotExecutable(7)), // exposure-mode
				InquiryFailedFatally(
					[NotExecutableWithNoCommandsAwaitingInitialResponseMatcher, /\[90 67 41 FF\]/],
					'exposure-mode'
				),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('command not executable, after a pending inquiry', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(ExposureModeInquiry, 'exposure-mode'),
				CameraExpectIncomingBytes([0x81, 0x09, 0x04, 0x39, 0xff]), // exposure-mode
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // focus-near
				CameraReplyBytes(CommandNotExecutable(1)), // focus-near
				CommandFailed(CantBeExecutedNowMatcher, 'focus-near'),
				InstanceStatusIs(InstanceStatus.Ok),
				CameraReplyBytes([0x90, 0x50, 0x0a, 0xff]), // exposure-mode
				InquirySucceeded({ val: '2' }, 'exposure-mode'),
			],
			InstanceStatus.Ok
		)
	})
})

describe('command error with no commands awaiting initial response', () => {
	test('command error with one command acknowledged', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(FocusNearStandard, 'focus-near'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x08, 0x03, 0xff]), // focus-near
				CameraReplyBytes(ACK(1)), // focus-near
				CameraReplyBytes([0x90, 0x60, 0x02, 0xff]),
				CommandFailedFatally(
					[/^Unexpected error with no messages awaiting initial response/, /\[90 60 02 FF\]/],
					'focus-near'
				),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})

describe('VISCA port command buffer full', () => {
	test('command buffer full, resent', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'close'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x06, 0x06, 0x03, 0xff]), // close
				CameraReplyBytes(CommandBufferFull), // close
				CameraExpectIncomingBytes([0x81, 0x01, 0x06, 0x06, 0x03, 0xff]), // close again
				CameraReplyBytes(ACKCompletion(2)), // close again
				CommandSucceeded('close'),
			],
			InstanceStatus.Ok
		)
	})

	test('command buffer full, dropped', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'close'),
				SendCommand(OnScreenDisplayToggle, 'toggle'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x06, 0x06, 0x03, 0xff]), // close
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x3f, 0x02, 0x5f, 0xff]), // toggle
				CameraReplyBytes(CommandBufferFull), // close
				CommandFailed([/^Command buffer full: /, /81 01 06 06 03 FF/, / was not executed$/], 'close'),
				CameraReplyBytes(ACKCompletion(2)), // toggle
				CommandSucceeded('toggle'),
			],
			InstanceStatus.Ok
		)
	})
})

describe('syntax error in user-defined message', () => {
	test('syntax error in user-defined command', async () => {
		const ResetSharpness = new UserDefinedCommand([0x81, 0x01, 0x04, 0x02, 0x00, 0xff])

		return RunCameraInteractionTest(
			[
				SendCommand(ResetSharpness, 'reset-sharpness'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x04, 0x02, 0x00, 0xff]), // reset-sharpness
				CameraReplyBytes(SyntaxError), // reset-sharpness
				CommandFailed(
					[CameraReportedSyntaxErrorMatcher, /\[81 01 04 02 00 FF\]/, UserDefinedMessageMatcher],
					'reset-sharpness'
				),
			],
			InstanceStatus.Ok
		)
	})

	test('syntax error in user-defined inquiry', async () => {
		const ABCDInquiry = new UserDefinedInquiry([0x81, 0x0a, 0x0b, 0x0c, 0x0d, 0xff], {
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
				CameraExpectIncomingBytes([0x81, 0x0a, 0x0b, 0x0c, 0x0d, 0xff]), // ABCD
				CameraReplyBytes(SyntaxError), // ABCD
				InquiryFailed([CameraReportedSyntaxErrorMatcher, /\[81 0A 0B 0C 0D FF\]/, UserDefinedMessageMatcher], 'ABCD'),
			],
			InstanceStatus.Ok
		)
	})
})

describe('unrecognized VISCA error return message', () => {
	test('not ACK, not Completion, not inquiry answer, not error', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'close'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x06, 0x06, 0x03, 0xff]), // close
				CameraReplyBytes([0x90, 0x60, 0x17, 0xff]), // close, 17 not 41/03/02
				CommandFailedFatally([UnrecognizedErrorMatcher, /\[90 60 17 FF\]/], 'close'),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})

describe('unrecognized VISCA return message', () => {
	test('not ACK, not Completion, not inquiry answer, not error', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(OnScreenDisplayClose, 'close'),
				CameraExpectIncomingBytes([0x81, 0x01, 0x06, 0x06, 0x03, 0xff]), // close
				CameraReplyBytes([0x90, 0x70, 0x17, 0xff]), // close, 70 not 4x/5x/6x
				CommandFailedFatally([UnrecognizedFormatMatcher, /\[90 70 17 FF\]/], 'close'),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})

describe('terminator embedded in command via param', () => {
	test('terminator in computed command bytes', async () => {
		const MyCustomCommand = new UserDefinedCommand([0x81, 0xf0, 0xff], {
			param: {
				nibbles: [3],
				choiceToParam: (choice: string): number => {
					return parseInt(choice, 16)
				},
			},
		})

		return RunCameraInteractionTest(
			[
				SendCommand(MyCustomCommand, { param: 'F' }, 'custom-command'),
				CommandFailed([AttemptSendInvalidMatcher, /\[81 FF FF\]/], 'custom-command'),
			],
			InstanceStatus.Ok
		)
	})
})
