import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { FocusLock } from '../../camera/focus.js'
import { PanTiltHome } from '../../camera/pan-tilt.js'
import { CameraPower } from '../../camera/power.js'
import { ACK, CameraPowerBytes, Completion, FocusLockBytes, PanTiltHomeBytes } from './camera-interactions/bytes.js'
import {
	CameraExpectIncomingBytes,
	CameraReplyBytes,
	CommandSucceeded,
	SendCommand,
} from './camera-interactions/interactions.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('multiple ACKs in same socket', () => {
	test('two in same socket', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(CameraPower, { state: 'on' }, 'camera-power'),
				SendCommand(FocusLock, 'focus-lock'),
				SendCommand(PanTiltHome, 'ptz-home'),
				CameraExpectIncomingBytes(CameraPowerBytes), // camera-power
				CameraReplyBytes(ACK(1)), // camera-power
				CameraExpectIncomingBytes(FocusLockBytes), // focus-lock
				CameraExpectIncomingBytes(PanTiltHomeBytes), // ptz-home
				CameraReplyBytes(ACK(2)), // focus-lock
				CameraReplyBytes(ACK(1)), // ptz-home
				CameraReplyBytes(Completion(1)), // camera-power
				CommandSucceeded('camera-power'),
				CameraReplyBytes(Completion(2)), // focus-lock
				CommandSucceeded('focus-lock'),
				CameraReplyBytes(Completion(1)), // ptz-home
				CommandSucceeded('ptz-home'),
			],
			InstanceStatus.Ok,
		)
	})

	test('two in same socket, out of order', async () => {
		return RunCameraInteractionTest(
			[
				SendCommand(CameraPower, { state: 'on' }, 'camera-power'),
				SendCommand(FocusLock, 'focus-lock'),
				SendCommand(PanTiltHome, 'ptz-home'),
				CameraExpectIncomingBytes(CameraPowerBytes), // camera-power
				CameraReplyBytes(ACK(1)), // camera-power
				CameraExpectIncomingBytes(FocusLockBytes), // focus-lock
				CameraExpectIncomingBytes(PanTiltHomeBytes), // ptz-home
				CameraReplyBytes(ACK(2)), // focus-lock
				CameraReplyBytes(ACK(1)), // ptz-home
				CameraReplyBytes(Completion(1)), // camera-power
				CommandSucceeded('camera-power'),
				CameraReplyBytes(Completion(1)), // ptz-home (out of order!)
				CommandSucceeded('ptz-home'),
				CameraReplyBytes(Completion(2)), // focus-lock
				CommandSucceeded('focus-lock'),
			],
			InstanceStatus.Ok,
		)
	})
})
