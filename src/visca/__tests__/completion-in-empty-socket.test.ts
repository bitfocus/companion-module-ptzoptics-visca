import { InstanceStatus } from '@companion-module/base'
import { describe, test } from 'vitest'
import { FocusLock } from '../../camera/focus.js'
import { CameraPower } from '../../camera/power.js'
import { ACKCompletion, CameraPowerBytes, Completion, FocusLockBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CameraReplyNetworkChange,
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
				SendCommand(CameraPower, { state: 'on' }, 'camera-power'),
				CameraExpectIncomingBytes(CameraPowerBytes), // camera-power
				CameraReplyNetworkChange([0x90, 0x38, 0xff]), // not essential to this test: randomly added to tests
				CameraReplyBytes(Completion(1)), // camera-power
				CommandFailedFatally([CompletionInEmptySocketMatcher(1), MatchVISCABytes(Completion(1))], 'camera-power'),
			],
			InstanceStatus.ConnectionFailure,
		)
	})

	test('completion in never-used socket with prior command', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(CameraPower, { state: 'on' }, 'camera-power'),
				SendCommand(FocusLock, 'focus-lock'),
				CameraExpectIncomingBytes(CameraPowerBytes), // camera-power
				CameraExpectIncomingBytes(FocusLockBytes), // focus-lock
				CameraReplyBytes(ACKCompletion(1)), // camera-power
				CommandSucceeded('camera-power'),
				CameraReplyBytes(Completion(2)), // focus-lock
				CommandFailedFatally([CompletionInEmptySocketMatcher(2), MatchVISCABytes(Completion(2))], 'focus-lock'),
			],
			InstanceStatus.ConnectionFailure,
		)
	})

	test('completion in used-but-emptied socket', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(CameraPower, { state: 'on' }, 'camera-power'),
				SendCommand(FocusLock, 'focus-lock'),
				CameraExpectIncomingBytes(CameraPowerBytes), // camera-power
				CameraReplyBytes(ACKCompletion(1)), // camera-power
				CommandSucceeded('camera-power'),
				CameraExpectIncomingBytes(FocusLockBytes), // focus-lock
				CameraReplyBytes(Completion(1)), // focus-lock
				CommandFailedFatally([CompletionInEmptySocketMatcher(1), MatchVISCABytes(Completion(1))], 'focus-lock'),
			],
			InstanceStatus.ConnectionFailure,
		)
	})
})
