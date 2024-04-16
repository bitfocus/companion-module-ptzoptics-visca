import { InstanceStatus } from '@companion-module/base'
import { describe, test } from '@jest/globals'
import { UserDefinedCommand } from '../command.js'
import { CommandFailed, SendCommand } from './camera-interactions/interactions.js'
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
				// NOTE: No bytes are ever sent to (or received by) the camera.
			],
			InstanceStatus.Ok
		)
	})
})
