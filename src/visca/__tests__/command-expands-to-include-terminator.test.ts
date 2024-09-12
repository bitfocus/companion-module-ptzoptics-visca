import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { UserDefinedCommand } from '../command.js'
import { CommandFailed, SendCommand, WaitUntilConnectedToCamera } from './camera-interactions/interactions.js'
import { AttemptSendInvalidMatcher, MatchVISCABytes } from './camera-interactions/matchers.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

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
				CommandFailed([AttemptSendInvalidMatcher, MatchVISCABytes([0x81, 0xff, 0xff])], 'custom-command'),
				// SendCommand usually implicitly waits for the connection to
				// the camera to be established (and instance status to be
				// updated).  But embedded terminators are detected before that
				// waiting occurs, so instance status could still be Connecting
				// here, and we must wait explicitly if the `InstanceStatus.Ok`
				// at end of tests is to be guaranteed correct.
				WaitUntilConnectedToCamera(),
				// NOTE: No bytes are ever sent to (or received by) the camera.
			],
			InstanceStatus.Ok,
		)
	})
})
