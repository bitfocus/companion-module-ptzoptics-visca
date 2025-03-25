import { InstanceStatus } from '@companion-module/base'
import { describe, test } from 'vitest'
import { InstanceStatusIs, WaitUntilConnectedToCamera } from './camera-interactions/interactions.js'
import { RunCameraInteractionTest } from './camera-interactions/run-test.js'

describe('port connected', () => {
	test('wait for connection explicitly', async () => {
		return RunCameraInteractionTest(
			[
				// Operations to initiate a connection have occurred, but (as
				// the code exists now) we haven't yet returned to the event
				// loop (which will allow the connection to be established) --
				// so we're still connecting here.
				InstanceStatusIs(InstanceStatus.Connecting),
				WaitUntilConnectedToCamera(),
			],
			InstanceStatus.Ok,
		)
	})

	// It would be *really* nice to test that for a port that's been opened and
	// `connect()` immediately called, closing before the `connect()` resolves
	// will cause the `connect()` to reject with an error with the provided
	// closure reason as message.  To do this, the connection triggered by the
	// port can't be established *too quickly*.  That seems nearly impossible to
	// replicate with a purely local server and connection (and node:net doesn't
	// expose a way to artificially delay connection establishment), so we do
	// without for now.
})
