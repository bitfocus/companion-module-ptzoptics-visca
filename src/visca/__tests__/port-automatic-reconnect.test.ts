import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { ACK } from './camera-interactions/bytes.js'
import {
	CameraDisconnection,
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CheckPriorStatuses,
	CommandFailedFatally,
	InquiryFailedFatally,
	SendCommand,
	SendInquiry,
	WaitForLogMessage,
} from './camera-interactions/interactions.js'
import { CameraClosedConnectionMatcher } from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'
import { ModuleDefinedCommand } from '../newcommand.js'
import { ModuleDefinedInquiry } from '../inquiry.js'

describe('When the camera closes the connection, the VISCA port should attempt to reconnect', () => {
	const TestCommandBytes = [0x81, 0x17, 0x42, 0xff] as const
	const TestCommand = new ModuleDefinedCommand(TestCommandBytes)

	const TestInquiryBytes = [0x81, 0x31, 0x41, 0x59, 0xff] as const
	const TestInquiry = new ModuleDefinedInquiry(TestInquiryBytes, {
		bytes: [0x90, 0x50, 0x07, 0xff],
		params: {},
	})

	test('pending command', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(TestCommand, 'test-command'),
				CameraExpectIncomingBytes(TestCommandBytes), // test-command
				CameraReplyBytes(ACK(5)), // test-command
				CheckPriorStatuses([InstanceStatus.Connecting, InstanceStatus.Ok]),
				WaitForLogMessage(/^Processing \[81 17 42 FF\] ACK in socket /),
				CameraDisconnection(),
				CommandFailedFatally(CameraClosedConnectionMatcher, 'test-command'),
				WaitForLogMessage(/^Socket status change: ok/),
				CheckPriorStatuses([InstanceStatus.ConnectionFailure, InstanceStatus.Connecting, InstanceStatus.Ok]),
			],
			InstanceStatus.Ok,
		)
	})

	test('pending inquiry', async () => {
		return RunCameraInteractionTest(
			[
				SendInquiry(TestInquiry, 'test-inquiry'),
				CameraExpectIncomingBytes(TestInquiryBytes), // test-inquiry
				CheckPriorStatuses([InstanceStatus.Connecting, InstanceStatus.Ok]),
				CameraDisconnection(),
				InquiryFailedFatally(CameraClosedConnectionMatcher, 'test-inquiry'),
				WaitForLogMessage(/^Socket status change: ok/),
				CheckPriorStatuses([InstanceStatus.ConnectionFailure, InstanceStatus.Connecting, InstanceStatus.Ok]),
			],
			InstanceStatus.Ok,
		)
	})

	test('pending command *and* inquiry', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(TestCommand, 'test-command'),
				CameraExpectIncomingBytes(TestCommandBytes), // test-command
				SendInquiry(TestInquiry, 'test-inquiry'),
				CameraExpectIncomingBytes(TestInquiryBytes), // test-inquiry
				CameraReplyBytes(ACK(5)), // test-command
				CheckPriorStatuses([InstanceStatus.Connecting, InstanceStatus.Ok]),
				WaitForLogMessage(/^Processing \[81 17 42 FF\] ACK in socket /),
				CameraDisconnection(),
				InquiryFailedFatally(CameraClosedConnectionMatcher, 'test-inquiry'),
				CommandFailedFatally(CameraClosedConnectionMatcher, 'test-command'),
				WaitForLogMessage(/^Socket status change: ok/),
				CheckPriorStatuses([InstanceStatus.ConnectionFailure, InstanceStatus.Connecting, InstanceStatus.Ok]),
			],
			InstanceStatus.Ok,
		)
	})
})
