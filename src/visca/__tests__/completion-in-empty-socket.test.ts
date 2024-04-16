import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { CameraPower, FocusLock } from '../../camera/commands.js'
import { ACKCompletion, CameraPowerBytes, Completion, FocusLockBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CommandFailedFatally,
	CommandSucceeded,
	SendCommand,
} from './camera-interactions/interactions.js'
import { CompletionInEmptySocketMatcher, MatchVISCABytes } from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('completion in empty socket', () => {
	test('completion in never-used socket', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(CameraPower, { bool: 'on' }, 'camera-power'),
				CameraExpectIncomingBytes(CameraPowerBytes), // camera-power
				CameraReplyBytes(Completion(1)), // camera-power
				CommandFailedFatally([CompletionInEmptySocketMatcher(1), MatchVISCABytes(Completion(1))], 'camera-power'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('completion in never-used socket with prior command', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(CameraPower, { bool: 'on' }, 'camera-power'),
				SendCommand(FocusLock, 'focus-lock'),
				CameraExpectIncomingBytes(CameraPowerBytes), // camera-power
				CameraExpectIncomingBytes(FocusLockBytes), // focus-lock
				CameraReplyBytes(ACKCompletion(1)), // camera-power
				CommandSucceeded('camera-power'),
				CameraReplyBytes(Completion(2)), // focus-lock
				CommandFailedFatally([CompletionInEmptySocketMatcher(2), MatchVISCABytes(Completion(2))], 'focus-lock'),
			],
			InstanceStatus.ConnectionFailure
		)
	})

	test('completion in used-but-emptied socket', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(CameraPower, { bool: 'on' }, 'camera-power'),
				SendCommand(FocusLock, 'focus-lock'),
				CameraExpectIncomingBytes(CameraPowerBytes), // camera-power
				CameraReplyBytes(ACKCompletion(1)), // camera-power
				CommandSucceeded('camera-power'),
				CameraExpectIncomingBytes(FocusLockBytes), // focus-lock
				CameraReplyBytes(Completion(1)), // focus-lock
				CommandFailedFatally([CompletionInEmptySocketMatcher(1), MatchVISCABytes(Completion(1))], 'focus-lock'),
			],
			InstanceStatus.ConnectionFailure
		)
	})
})
