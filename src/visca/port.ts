import {
	assertNever,
	type CompanionOptionValues,
	InstanceStatus,
	TCPHelper,
	type TCPHelperEvents,
} from '@companion-module/base'
import { checkCommandBytes, type Command, type Inquiry, type Response, responseMatches } from './command.js'
import type { PtzOpticsInstance } from '../instance.js'
import { prettyBytes } from '../utils/pretty.js'
import { promiseWithResolvers } from '../utils/promise-with-resolvers.js'

const BLAME_MODULE =
	'This is likely a bug in the ptzoptics-visca Companion module.  Please ' +
	"click the bug icon by any camera instance in the table in Companion's " +
	'Connections tab to report it.'

/** The type of a VISCA message sent to a camera. */
export type MessageType = 'command' | 'inquiry'

/**
 * The type of the resolve handler for a pending VISCA message sent to the
 * camera, where an error was encountered for this message but the connection is
 * still stable and able to process further commands and inquiries.
 */
type MessageResolveNonfatally = (reason: Error) => void

/**
 * The type of the reject handler for a pending VISCA message that couldn't be
 * processed because a VISCA protocol violation occurred and the connection is
 * now unusable.
 */
type MessageRejectFatally = (reason: Error) => void

/**
 * Information about a VISCA message sent to the camera, for which a full
 * response has not yet been received.
 */
abstract class PendingBase {
	/** The type of the pending message. */
	abstract readonly type: MessageType

	/**
	 * The bytes that make up the message.  If this message is a command with
	 * parameters, their values will be interpolated into these bytes.
	 */
	readonly bytes: readonly number[]

	/**
	 * Whether the message corresponds to a user-defined command that a camera
	 * might not recognize and might respond to with an error.
	 */
	readonly userDefined: boolean

	/**
	 * The resolve handler if the response to this message is an error, yet not
	 * an error that is inherently unrecoverable and requires the connection to
	 * fail.  In such cases the error is logged but will not fail the
	 * connection.
	 */
	protected abstract readonly resolve: MessageResolveNonfatally

	/**
	 * The reject handler if the response to this message is treated as a fatal
	 * error.  A fatal error (if not handled through a `.catch` or similar)
	 * causes this module connection to completely break:
	 * the only way to recover is to disable and then enable the connection.
	 */
	readonly #reject: MessageRejectFatally

	/**
	 * Record information for a VISCA message sent to the camera but whose full
	 * response hasn't been received yet.
	 *
	 * @param bytes
	 *    The bytes of the message.
	 * @param userDefined
	 *    Whether the message was constructed from a user-defined byte sequence.
	 * @param reject
	 *    A handler function to use if a fatal error occurred while processing
	 *    the response to this message.
	 */
	constructor(bytes: readonly number[], userDefined: boolean, reject: MessageRejectFatally) {
		this.bytes = bytes
		this.userDefined = userDefined
		this.#reject = reject
	}

	/**
	 * Record a fatal error for the given message and place the instance in
	 * connection-failure status.
	 *
	 * What errors are treated as fatal?
	 *
	 * Transport errors -- for example, if VISCA messages and responses somehow
	 * fall out of sync -- are treated as fatal because we no longer know what
	 * message a response corresponds to.
	 *
	 * Errors returned by the camera to individual commands are usually *not*
	 * treated as fatal.  People use this module with non-PTZOptics cameras that
	 * may not support commands identical to how PTZOptics cameras support them.
	 * We'd rather we only broke them if PTZOptics cameras demanded it.
	 *
	 * But even PTZOptics cameras' command sets vary across time and firmware
	 * revision, so it's perilous to take a hard line.  (Within the commands
	 * this module exposes, the Exposure Mode action's "Bright mode (manual)"
	 * setting seems to be supported with G2 cameras but doesn't exist with some
	 * G3 firmware revisions.  And the Preset Drive Speed command is
	 * preset-specific with some models/firmware, but universal with others.)
	 *
	 * Unless and until we expose some way of selecting the camera model in an
	 * instance configuration field, we log errors returned by the camera but
	 * don't fail the connection.
	 *
	 * @param reason
	 *    A message indicating the reason for the fatal error.
	 */
	fatalError(reason: string) {
		this.#reject(new Error(reason))
	}

	/**
	 * Record a nonfatal error for the given message.  The connection will
	 * continue to work, and further commands and inquiries can still be sent to
	 * the camera.
	 *
	 * @param reason
	 *    A message indicating the reason for the nonfatal error.
	 */
	nonfatalError(reason: string) {
		this.resolve(new Error(reason))
	}
}

/**
 * The type of the resolve handler for a pending VISCA command that is expected
 * to receive the standard ACK + Completion response.
 *
 * If the command receives the standard ACK + Completion response, the handler
 * resolves void.
 *
 * But if the command instead receives a camera response indicating an error
 * that doesn't suggest any sort of connection instability or decoherence, the
 * handler resolves an `Error` indicating details of the error encountered, and
 * the connection will remain active.
 */
type CommandResolve = (result: void | Error) => unknown

/**
 * Information about a VISCA command sent to the camera, for which a full
 * response has not yet been received.
 */
class PendingCommand extends PendingBase {
	readonly type = 'command'
	protected readonly resolve: CommandResolve

	/**
	 * Record information for a VISCA command sent to the camera but whose full
	 * response hasn't been received yet.
	 *
	 * @param bytes
	 *    The bytes of the command.
	 * @param userDefined
	 *    Whether the command was constructed from a user-defined byte sequence.
	 * @param resolve
	 *    A handler function to use if the command executes without error or if
	 *    the command executes with a recoverable error that doesn't indicate
	 *    the connection is destabilized.
	 * @param reject
	 *    A handler function to use if a fatal error occurred while processing
	 *    the response to this message.
	 */
	constructor(bytes: readonly number[], userDefined: boolean, resolve: CommandResolve, reject: MessageRejectFatally) {
		super(bytes, userDefined, reject)

		this.resolve = resolve
	}

	/** Resolve this command as having executed without error. */
	succeeded() {
		this.resolve()
	}
}

/**
 * The type of the resolve handler for a pending VISCA inquiry.
 *
 * If the inquiry executes successfully and receives a response that is valid
 * per the `Inquiry` that was sent, it resolves options computed per the
 * parameters specified in that `Inquiry`.
 *
 * But if the inquiry instead receives a camera response indicating an error
 * that doesn't suggest any sort of connection instability or decoherence, the
 * handler resolves an `Error` indicating details of the error encountered, and
 * the connection will remain active.
 */
type InquiryResolve = (val: CompanionOptionValues | Error) => void

/**
 * Information about a VISCA inquiry sent to the camera, for which a full
 * response has not yet been received.
 */
class PendingInquiry extends PendingBase {
	readonly type = 'inquiry'
	protected readonly resolve: InquiryResolve
	readonly expectedResponse: Response

	/**
	 * Record information for a VISCA inquiry sent to the camera that hasn't
	 * yet received a response.
	 *
	 * @param bytes
	 *    The bytes of the inquiry.
	 * @param userDefined
	 *    Whether the inquiry was constructed from a user-defined byte sequence.
	 * @param resolve
	 *    A handler function to use if the inquiry executes without error (and
	 *    returns answers to the inquiry made) or if the inquiry executes with a
	 *    recoverable error that doesn't indicate the connection is
	 *    destabilized.
	 * @param reject
	 *    A handler function to use if a fatal error occurred while processing
	 *    the response to this inquiry.
	 */
	constructor(
		bytes: readonly number[],
		userDefined: boolean,
		resolve: InquiryResolve,
		reject: MessageRejectFatally,
		expectedResponse: Response,
	) {
		super(bytes, userDefined, reject)

		this.resolve = resolve
		this.expectedResponse = expectedResponse
	}

	/**
	 * Resolve this inquiry with options corresponding to parameters in the
	 * inquiry response.
	 */
	succeeded(options: CompanionOptionValues) {
		this.resolve(options)
	}
}

/**
 * The type of a VISCA message sent to a camera: either a command (potentially
 * containing fillable numeric parameters) or an inquiry (a fixed byte sequence
 * whose response matches a specific format that contains numeric parameters).
 */
type PendingMessage = PendingCommand | PendingInquiry

/**
 * The subset of the `PtzOpticsInstance` interface used by `VISCAPort` to log
 * messages and update instance connection status.
 */
export interface PartialInstance {
	/** See {@link PtzOpticsInstance.log}. */
	log: PtzOpticsInstance['log']

	/** See {@link PtzOpticsInstance.updateStatus}. */
	updateStatus: PtzOpticsInstance['updateStatus']

	/** See {@link PtzOpticsInstance.debugLogging}. */
	readonly debugLogging: boolean
}

/**
 * An async generator of arrays of bytes constituting distinct return messages
 * returned by the camera.
 */
type ReturnMessages = AsyncGenerator<readonly number[], void, unknown>

type DisconnectedStatus = { type: 'disconnected' }

type ConnectingStatus = {
	type: 'connecting'

	/**
	 * A promise that resolves when the port connection attempt succeeds or
	 * rejects when the attempt is canceled because the port is closed.
	 */
	open: Promise<void>

	/** A function that can be used to reject `open`. */
	reject: (this: void, reason: Error) => void
}

type ConnectedStatus = { type: 'connected' }

/**
 * The connection status of a port.
 */
type ConnectionStatus = DisconnectedStatus | ConnectingStatus | ConnectedStatus

/**
 * A port abstraction into which VISCA commands can be written.
 */
export class VISCAPort {
	/**
	 * The TCP socket through which commands are sent and responses received,
	 * if this port is open.
	 */
	#socket: TCPHelper | null = null

	/**
	 * The connection status of a port.
	 *
	 * Ports begin life disconnected, then proceed to connecting with associated
	 * promise to wait on for connection to complete, then proceed to connected
	 * or revert to disconnected when that promise settles.
	 *
	 * When the connection is closed, or if the connection encounters a VISCA
	 * coherency error that requires the connection be closed because VISCA
	 * responses can no longer be unambiguously interpreted, status reverts to
	 * disconnected.  On the other hand, if the connection closes because of a
	 * network issue, the port will attempt to reestablish the connection until
	 * it succeeds or the port is closed.
	 */
	#connectionStatus: ConnectionStatus = { type: 'disconnected' }

	/** The instance that created this port. */
	#instance: PartialInstance

	/**
	 * Commmands *and* inquiries sent to the camera but that the camera hasn't
	 * responded to yet (even by the half-response of a lone ACK).
	 *
	 * Representing these as an array imposes linear cost on finding the first
	 * message to which a response might apply, and on removing such
	 * message after initial-response processing is finished.  We don't worry
	 * about this because messages shouldn't pile up that far in practice (and
	 * usually the first message is the desired one, and we assume JavaScript's
	 * array representation is optimized to allow amortized-cheap removal of
	 * leading elements).
	 */
	readonly #waitingForInitialResponse: PendingMessage[] = []

	/**
	 * Commands whose bytes have been sent, for which an ACK has been received
	 * (that assigns the command to the given command socket), but for which a
	 * Completion hasn't yet been received.
	 *
	 * In principle, this should simply map socket to a single pending command.
	 * But in reality, the PTZOptics Move SE G3 will, if pressured, assign
	 * multiple commands to the same socket *without always clearing the
	 * socket*.  So instead of that simple mapping, we map socket to a *list* of
	 * pending commands, and we apply Completions and the like to the first
	 * command occupying the socket.  🤷
	 */
	readonly #waitingForCompletion: Map<number, PendingCommand[]> = new Map()

	/**
	 * Create an error to throw during message/response processing.  The error
	 * will have `msg` as its message and will include a representation of
	 * `bytes`.
	 *
	 * @param msg
	 *    An error message describing the error
	 * @param bytes
	 *    Bytes that relate to the contents of `msg`.  Depending how `msg` is
	 *    written, these could be from a command, an inquiry, *or* a response.
	 * @returns
	 *    An error containing the message and pretty-printed `bytes`
	 */
	#errorWhileProcessingMessage(msg: string, bytes: readonly number[]): Error {
		return new Error(`${msg} (VISCA bytes ${prettyBytes(bytes)})`)
	}

	/**
	 * Create a VISCAPort associated with the provided instance.  The port is
	 * initially closed and must be opened to be used.
	 */
	constructor(instance: PartialInstance) {
		this.#instance = instance
	}

	/** True iff this port is currently closed. */
	get closed(): boolean {
		return this.#socket === null
	}

	/**
	 * Close this port if it's either open or in the process of reconnecting
	 * after a network error, rejecting any pending connection attempts,
	 * commands, and inquiries.  (This will do nothing if the port is already
	 * closed.)  Also update the status of the associated instance.
	 *
	 * @param reason
	 *   A reason-string used to reject either an in-progress connection attempt
	 *   or any pending commands/inquiries.
	 * @param status
	 *   The status to update the associated instance to.
	 */
	close(reason: string, status: InstanceStatus): void {
		const instance = this.#instance
		let didClose = false
		if (this.#socket !== null) {
			didClose = true

			this.#socket.destroy()
			this.#socket = null
			if (this.#connectionStatus.type === 'connecting') {
				const { open, reject } = this.#connectionStatus

				// Log the connection attempt being aborted, but also ensure
				// that `open` never goes completely unhandled if the port is
				// closed with no commands/inquiries sent and `connect()` never
				// called.
				open.catch((reason: Error) => {
					instance.log('error', `Error attempting to connect to camera: ${reason.message}`)
				})

				reject(new Error('Port closed before a connection was established'))
			}
			this.#connectionStatus = { type: 'disconnected' }
		}

		instance.updateStatus(status)

		if (didClose) {
			// Empty out all pending commands, then resolve them all with fatal
			// errors.  Start with commands that have received an ACK, because
			// they necessarily were received before messages still awaiting an
			// initial response.
			const waitingForCompletion = [...this.#waitingForCompletion.values()]
			this.#waitingForCompletion.clear()
			const waitingForInitialResponse = this.#waitingForInitialResponse.splice(0)

			for (const pendingCommands of waitingForCompletion) {
				for (const pendingCommand of pendingCommands) {
					pendingCommand.fatalError(reason)
				}
			}
			for (const pendingMessage of waitingForInitialResponse) {
				pendingMessage.fatalError(reason)
			}
		}
	}

	/**
	 * Open this port connecting to the given host:port (first closing it if
	 * it's currently open).
	 *
	 * This operation initiates a connection to the camera and reading of return
	 * messages from it, but it doesn't delay for the connection to actually be
	 * established, because this could in principle take a long time.  Command
	 * and inquiry sending will implicitly wait for the connection to be
	 * established, if needed.  If you require the connection to be established,
	 * await `connect()` after calling this function.
	 */
	open(host: string, port: number): void {
		this.close('Socket is being reopened', InstanceStatus.Connecting)

		const instance = this.#instance

		// Attempt to reconnect on error so that transient connection failures
		// will be recovered from (albeit with any incomplete commands/inquiries
		// dropped, because we don't know whether we're in a state where it's
		// right to reattempt them).  However, VISCA protocol errors that impede
		// interpreting subsequent VISCA messages will not be recovered, because
		// they may be caused by conditions that will be present on reconnection
		// and might trigger an infinite error loop.
		const socket = new TCPHelper(host, port, { reconnect: true })

		type TCPStatuses = TCPHelperEvents['status_change'][0]
		socket.on('status_change', (status: TCPStatuses, message = '') => {
			const maybeExplanation = message && ` (${message})`
			instance.log('debug', `Socket status change: ${status}${maybeExplanation}`)
		})

		const onSocketComplete = (closeReason: string) => {
			const connectionStatus = this.#connectionStatus.type
			switch (connectionStatus) {
				// Ignore connection errors (such as "Connection refused") that
				// occur while the module is attempting to establish the initial
				// connection to the camera (including on "reconnect" attempts,
				// as requested above, if the first try fails).  This lets users
				// start Companion and their cameras in either order, rather
				// than forcing them to start one first, then the other.
				case 'connecting':
					break

				case 'connected':
				case 'disconnected':
					// Errors not during the initial connection attempt should
					// close the port.
					this.close(closeReason, InstanceStatus.ConnectionFailure)

					// ..and then we should try to reopen the port.  This won't
					// retry commands/inquiries that were previously pending: we
					// don't know to what extent they might have been partially
					// (or completely!) performed, so it's up to the user to
					// decide how to dig themselves out of this hole.
					this.open(host, port)
					break

				default:
					assertNever(connectionStatus)
					break
			}
		}

		type SocketError = TCPHelperEvents['error'][0]
		socket.on('error', (err: SocketError) => {
			const error = `Network error: ${err.message}`
			instance.log('error', error)

			onSocketComplete(error)
		})

		socket.on('end', () => {
			const error = 'Network error: camera closed its side of the connection'
			instance.log('error', error)

			onSocketComplete(error)
		})

		const {
			promise: connectionOpenedPromise,
			resolve: connectionResolve,
			reject: connectionReject,
		} = promiseWithResolvers<void>()

		socket.once('connect', () => {
			const connectionStatus = this.#connectionStatus.type
			if (connectionStatus === 'connecting') {
				instance.log('debug', 'Connected')

				instance.updateStatus(InstanceStatus.Ok)
				this.#connectionStatus = { type: 'connected' }
				connectionResolve()
				return
			}

			// The remaining cases are internal logic errors, so close and don't
			// try to reconnect.
			let error
			let status = InstanceStatus.ConnectionFailure
			switch (connectionStatus) {
				case 'disconnected':
					error = 'Unexpected connection received while not connecting'
					break
				case 'connected':
					error = 'Received multiple connection events'
					break
				default:
					assertNever(connectionStatus)
					error = 'Logic error handling connection'
					status = InstanceStatus.UnknownError
					break
			}
			instance.log('error', error)
			this.close(error, status)
		})

		this.#socket = socket
		this.#connectionStatus = {
			type: 'connecting',
			open: connectionOpenedPromise,
			reject: connectionReject,
		}

		// Process return messages consistent with the commands/inquiries that
		// have been sent.
		const returnMessages = this.#readReturnMessages(socket)
		this.#processReturnMessages(socket, returnMessages)
			.catch((reason: Error) => {
				// This is a transport-level failure where VISCA messages from
				// the camera indicate some serious misunderstanding is afoot.
				// Close the port (incidentally disconnecting the `'error'`
				// handler above), and don't restart the connection: this could
				// result in performing the exact action that triggered the
				// transport-level failure, causing an infinite
				// start-error-stop-restart loop.
				const processingErrorReason = reason.message
				this.#instance.log('error', processingErrorReason)
				this.close(processingErrorReason, InstanceStatus.ConnectionFailure)
			})
			.finally(() => {
				this.#instance.log('info', `Return message processing completed`)
			})
	}

	/**
	 * Wait for a connection to the camera initiated by `open()` to be
	 * established.  Reject if the port was closed or if a preceding `open()`
	 * has not occurred.
	 */
	async connect(): Promise<void> {
		const status = this.#connectionStatus
		switch (status.type) {
			case 'disconnected':
				throw new Error("Port isn't opened")
			// @ts-expect-error intentional fallthrough
			case 'connecting':
				await status.open
			// falls through, should be connected now

			case 'connected':
				return
			default:
				assertNever(status)
		}
	}

	/**
	 * Asynchronously yield VISCA return messages (minimal-length byte sequences
	 * beginning with 0x90 and ending with 0xFF) read from `socket`, forever.
	 *
	 * @param socket
	 *    The TCP socket to read return messages from.
	 */
	async *#readReturnMessages(socket: TCPHelper): ReturnMessages {
		/** Received data not yet parsed as full return messages. */
		const receivedData: number[] = []

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this

		/**
		 * A promise that resolves when new data is available, then is reset to
		 * resolve for the next new data.
		 */
		let moreDataAvailable = (async function readMoreData(): Promise<void> {
			return new Promise((resolve) => {
				socket.once('data', (data) => {
					if (self.closed) {
						// Ignore incoming data if the connection's already closed
						// (including if by module error).
					} else {
						for (const b of data) receivedData.push(b)
						resolve()
						moreDataAvailable = readMoreData()
					}
				})
			})
		})()

		for (;;) {
			while (receivedData.length === 0) {
				await moreDataAvailable
			}

			// PTZOptics VISCA over IP responses always begin with 0x90.  But
			// some non-PTZOptics cameras (at least some Sony[0] and Aver[1]
			// models) periodically send a "Network Change Message" (z0 38 FF,
			// z = device address + 8) to signal the device's address for
			// daisy-chained RS-232 control  (Sony models don't send it in VISCA
			// over IP situations because this particular address is immaterial
			// to VISCA over IP, where the IP address uniquely identifies the
			// device and so messages only always apply to just one camera.  But
			// at least one report from the field shows there's a camera that
			// will send `80 38 FF` to the module.)
			//
			// Because this message isn't meaningful for VISCA over IP, and
			// because PTZOptics cameras don't send any `z0 xy FF` messages
			// where `x=3`, we can safely accept a `z0` leading byte here,
			// discard all received network change messages, then restrict all
			// other replies to start with `90`.
			//
			// 0. https://www.sony.net/Products/CameraSystem/CA/BRC_X400_SRG_X400/Technical_Document/E042100111.pdf
			// 1. https://communication.aver.com/DownloadFile.aspx?n=5174%7C0C0D934C-A84C-423C-A14F-42C5F322C8AD&t=ServiceDownload
			if ((receivedData[0] & 0b1000_1111) !== 0b1000_0000) {
				const leadingBytes = receivedData.slice(0, 8)
				throw this.#errorWhileProcessingMessage(
					'Camera sent return message data not starting with z0 (where z=8 to F)',
					leadingBytes,
				)
			}

			let i = 1
			let terminatorOffset = -1
			for (;;) {
				// VISCA return messages terminate with 0xFF.
				terminatorOffset = receivedData.indexOf(0xff, i)
				if (terminatorOffset > 0) {
					break
				}

				i = receivedData.length
				await moreDataAvailable
			}

			const returnMessage = receivedData.splice(0, terminatorOffset + 1)
			if (this.#instance.debugLogging) {
				this.#instance.log('info', `RECV: ${prettyBytes(returnMessage)}`)
			}
			yield returnMessage
		}
	}

	/**
	 * Asynchronously process VISCA return messages from the camera in response
	 * to commands and inquiries, forever.
	 *
	 * @param socket
	 *   The socket used by this port.
	 * @param returnMessages
	 * 	 A generator of return messages from the socket to the camera.
	 */
	async #processReturnMessages(socket: TCPHelper, returnMessages: ReturnMessages): Promise<void> {
		for await (const returnMessage of returnMessages) {
			// The response to a command/inquiry consists of one or more return
			// messages.  A return message begins with 90 and ends at the first
			// FF byte.
			//
			// Standard response:
			//   ACK (then later Completion, or maybe an error with a socket):
			//     90 4y FF  90 5y FF  (ACK, Completion)
			//     90 4y FF  ........  (ACK, some Error with socket)
			// Error:
			//   Command Not Executable:
			//     90 6y 41 FF
			//   Command Buffer Full:
			//     90 60 03 FF
			//   Syntax Error:
			//     90 60 02 FF
			// Inquiry response:
			//   90 50 ...one or more non-FF bytes...  FF
			// Network change response (some non-PTZOptics cameras only):
			//   z0 38 FF (z=8 to F)
			//
			// The second byte therefore dictates return message interpretation.
			//
			// (PTZOptics also describes No Socket and Command Canceled error
			// responses, but they're only returned in response to invalid VISCA
			// cancel-a-pending-command commands, and we never send that
			// command.)
			const secondByte = returnMessage[1]

			// Network change response (some non-PTZOptics cameras only):
			//   z0 38 FF (z=8 to F)
			if (secondByte === 0x38) {
				if (returnMessage.length !== 3) {
					throw this.#errorWhileProcessingMessage(
						'Received network change response of unexpected length',
						returnMessage,
					)
				}

				// As discussed in `#readReturnMessages`, ignore this message.
				continue
			}

			// Some VISCA flavors allow a `z0` initial byte in all return
			// messages, not just network changes.  We choose to be conservative
			// in what we accept until someone complains and permit it only in
			// network change messages.
			if (returnMessage[0] !== 0x90) {
				throw this.#errorWhileProcessingMessage('Received return message not starting with 0x90', returnMessage)
			}

			// ACK (and then later Completion or maybe an error):
			//   90 4y FF  90 5y FF  (ACK, Completion)
			//   90 4y FF  ........  (ACK, some Error)
			//
			// Move the command from the waiting-initial-response queue to the
			// waiting-for-completion queue with the socket (the `y` nibble)
			// encoded in the response.
			if ((secondByte & 0xf0) === 0x40) {
				if (returnMessage.length !== 3) {
					throw this.#errorWhileProcessingMessage(
						'Received malformed ACK, closing connection to avoid send/receive decoherence',
						returnMessage,
					)
				}

				const result = this.#findFirstCommandWaitingForInitialResponse()
				if (result === undefined) {
					throw this.#errorWhileProcessingMessage(`Received ACK without a pending command`, returnMessage)
				}
				const { i, command } = result

				const socket = secondByte & 0xf
				if (this.#instance.debugLogging) {
					this.#instance.log('info', `Processing ${prettyBytes(command.bytes)} ACK in socket ${socket}`)
				}

				this.#waitingForInitialResponse.splice(i, 1)
				let socketQueue = this.#waitingForCompletion.get(socket)
				if (socketQueue === undefined) {
					socketQueue = []
					this.#waitingForCompletion.set(socket, socketQueue)
				} else if (socketQueue.length > 0) {
					this.#instance.log('info', `Processing ${prettyBytes(command.bytes)} in already-filled socket ${socket}`)
				}
				socketQueue.push(command)
				continue
			} // (secondByte & 0xf0) === 0x40

			// Completion:
			//   90 5y FF  (after initial ACK)
			// Inquiry response:
			//   90 50 ...one or more non-FF bytes...  FF
			if ((secondByte & 0xf0) === 0x50) {
				// Completion:
				//   90 5y FF  (after initial ACK)
				if (returnMessage.length === 3) {
					// Remove the command from the waiting-completion queue
					// (also emptying its socket) and resolve the corresponding
					// command's promise.
					const socket = secondByte & 0x0f
					if (this.#instance.debugLogging) {
						this.#instance.log('info', `Completion in socket ${socket}`)
					}

					const commandsInSocket = this.#waitingForCompletion.get(socket)
					const command = commandsInSocket && commandsInSocket.shift()
					if (command === undefined) {
						throw this.#errorWhileProcessingMessage(
							`Received Completion for socket ${socket}, but no command is executing in it`,
							returnMessage,
						)
					}

					command.succeeded()
					continue
				}

				// Inquiry response:
				//   90 50 ...one or more non-FF bytes...  FF

				const result = this.#findFirstInquiryWaitingForInitialResponse()
				if (result === undefined) {
					throw this.#errorWhileProcessingMessage('Received inquiry response without a pending inquiry', returnMessage)
				}
				const { i, inquiry } = result

				const { value, mask, params } = inquiry.expectedResponse
				if (responseMatches(returnMessage, mask, value)) {
					// Resolve the inquiry's promise with options corresponding
					// to the response's parameters.
					const options: CompanionOptionValues = {}
					for (const [id, { nibbles, paramToChoice }] of Object.entries(params)) {
						let paramval = 0
						for (const nibble of nibbles) {
							const byteOffset = nibble >> 1
							const isLower = nibble % 2 === 1

							const byte = returnMessage[byteOffset]
							const contrib = isLower ? byte & 0xf : byte >> 4
							paramval = (paramval << 4) | contrib
						}

						options[id] = paramToChoice(paramval)
					}

					inquiry.succeeded(options)
				} else {
					const blame = inquiry.userDefined ? 'Double-check the syntax of your inquiry.' : BLAME_MODULE
					const reason =
						`Inquiry ${prettyBytes(inquiry.bytes)} received the ` +
						`response ${prettyBytes(returnMessage)} which isn't ` +
						`compatible with the expected format.  (${blame})`
					inquiry.nonfatalError(reason)
				}

				this.#waitingForInitialResponse.splice(i, 1)
				continue
			} // (secondByte & 0xf0) == 0x50

			// Error:
			//   Command Not Executable:
			//     90 6y 41 FF
			//   Command Buffer Full:
			//     90 60 03 FF
			//   Syntax Error:
			//     90 60 02 FF
			if ((secondByte & 0xf0) === 0x60) {
				if (returnMessage.length !== 4) {
					throw this.#errorWhileProcessingMessage('Encountered error response of unexpected length', returnMessage)
				}

				const thirdByte = returnMessage[2]

				//   Command Not Executable:
				//     90 6y 41 FF
				if (thirdByte === 0x41) {
					// The socket 'y' could in principle refer to a previously-
					// assigned socket via ACK.  Observable behavior with a Move
					// SE is that it does not.
					//
					// There's no way to safely handle both possibilities,
					// because mis-resolving a command in a socket will result
					// in an error when the command's Completion comes through
					// later.  So we implement for the only behavior observed
					// and hopefully wash our hands of the matter.

					const commandAwaitingInitialResponse = this.#findFirstCommandWaitingForInitialResponse()
					if (commandAwaitingInitialResponse === undefined) {
						throw this.#errorWhileProcessingMessage(
							'Received Command Not Executable with no commands awaiting initial response',
							returnMessage,
						)
					}
					const { i, command } = commandAwaitingInitialResponse

					const reason =
						'The command ' +
						prettyBytes(command.bytes) +
						" can't be executed now.  This is likely because the " +
						"command alters a setting that doesn't pertain to a " +
						'current camera mode.  (For example, the Focus Near ' +
						'command may require Manual Focus mode is active ' +
						'rather than Auto Focus mode.)  Activate the ' +
						'relevant camera mode before executing this command.'
					command.nonfatalError(reason)

					if (this.#instance.debugLogging) {
						this.#instance.log('info', 'Removing non-executable command from #waitingForInitialResponse')
					}

					this.#waitingForInitialResponse.splice(i, 1)
					continue
				}

				if (this.#waitingForInitialResponse.length === 0) {
					throw this.#errorWhileProcessingMessage(
						'Unexpected error with no messages awaiting initial response',
						returnMessage,
					)
				}

				const message = this.#waitingForInitialResponse[0]
				const messageBytes = message.bytes

				//   Command Buffer Full:
				//     90 60 03 FF
				if (thirdByte === 0x03) {
					// If there's only one pending message, we can  resend it.
					// Maybe some buffered-up commands (from some other entity
					// manipulating the camera, seemingly) will have cleared out
					// and the second try will succeed.
					if (this.#waitingForInitialResponse.length === 1) {
						this.#instance.log('info', `Command buffer full: resending ${prettyBytes(messageBytes)}`)
						const res = await this.#sendBytes(socket, messageBytes)
						if (res instanceof Error) {
							throw res
						}
						continue
					}

					// But if multiple messages' responses require processing,
					// we can't resend an earlier message without risking the
					// reordered messages not having the same semantics as the
					// initial ordering.  Record a nonfatal error (that will end
					// up in logs) and hope for the best as far as the user's
					// intended semantics go.
					this.#waitingForInitialResponse.shift()
					message.nonfatalError(`Command buffer full: ${prettyBytes(messageBytes)} was not executed`)
					continue
				}

				//   Syntax Error:
				//     90 60 02 FF
				if (thirdByte === 0x02) {
					// Different models of camera support different features, so
					// we can't treat a syntax error in a message defined by
					// this module as an error:
					//
					// 1) The Preset Drive Speed action triggers a syntax error
					//    with G3 cameras: the actual command doesn't contain a
					//    preset number parameter, so the speed change applies
					//    to all presets.  But we don't know if older cameras
					//    support it.
					// 2) The Exposure Mode action exposes a "Bright mode
					//    (manual)" option that was present in G2 cameras[0] but
					//    doesn't exist in G3 cameras[1] and triggers a syntax
					//    error with them.
					//
					// 0. https://ptzoptics.imagerelay.com/share/PTZOptics-G2-VISCA-over-IP-Commands
					// 1. https://ptzoptics.imagerelay.com/share/PTZOptics-G3-VISCA-over-IP-Commands
					const blame = message.userDefined ? 'Double-check the syntax of the message.' : BLAME_MODULE
					const reason = `Camera reported a syntax error in the message ${prettyBytes(messageBytes)}.  ${blame}`
					message.nonfatalError(reason)
					this.#waitingForInitialResponse.shift()
					continue
				}

				throw this.#errorWhileProcessingMessage(
					`Received error response to ${prettyBytes(messageBytes)} with unrecognized format`,
					returnMessage,
				)
			} // (secondByte & 0xf0) === 0x60

			throw this.#errorWhileProcessingMessage('Received response with unrecognized format', returnMessage)
		} // for await (const returnMessage of returnMessages)
	}

	// The next two functions are almost unifiable into one, but it would
	// require unsafe type assertions.  It may be possible to unify these when
	// https://github.com/microsoft/TypeScript/issues/33014 is resolved.

	/**
	 * Find the first command awaiting an initial response, potentially among
	 * pending inquiries.
	 */
	#findFirstCommandWaitingForInitialResponse(): { i: number; command: PendingCommand } | undefined {
		for (let i = 0; i < this.#waitingForInitialResponse.length; i++) {
			const message = this.#waitingForInitialResponse[i]
			if (message.type === 'command') {
				return { i, command: message }
			}
		}

		return undefined
	}

	/**
	 * Find the first inquiry awaiting an initial response, potentially among
	 * pending commands.
	 */
	#findFirstInquiryWaitingForInitialResponse(): { i: number; inquiry: PendingInquiry } | undefined {
		for (let i = 0; i < this.#waitingForInitialResponse.length; i++) {
			const message = this.#waitingForInitialResponse[i]
			if (message.type === 'inquiry') {
				return { i, inquiry: message }
			}
		}

		return undefined
	}

	/**
	 * Send the command specified by `command` and its compatible `options`,
	 * then start asynchronous processing of its response.
	 *
	 * Don't wait for preceding messages' responses to be processed before
	 * sending the command: some commands (for example, recalling presets) only
	 * receive a full response after a delay, and it isn't acceptable to delay
	 * all manipulations (for example, to quickly recall a different preset
	 * after a wrong button was fat-fingered) for that entire time.
	 *
	 * This function implicitly waits for the connection to be fully established
	 * as if `await this.connect()` had occurred.
	 *
	 * @param command
	 *    The command to send.
	 * @param options
	 *    Compatible options to use to fill in any parameters in `command`; may
	 *    be omitted or null if `command` has no parameters.
	 * @returns
	 *    A promise that resolves after the response (which may be an error
	 *    response) to `command` with parameters filled according to `options`
	 *    has been processed.  If the command failed, an `Error` is resolved; if
	 *    the command succeeded, the promise resolves `undefined`.
	 */
	async sendCommand(command: Command, options: CompanionOptionValues | null = null): Promise<void | Error> {
		const messageBytes = command.toBytes(options)
		const isUserDefined = command.isUserDefined()
		return this.#sendMessage('command', isUserDefined, messageBytes).then(async (result: void | Error) => {
			if (result !== undefined) {
				return result
			}

			return new Promise((resolve: CommandResolve, reject: MessageRejectFatally) => {
				this.#waitingForInitialResponse.push(new PendingCommand(messageBytes, isUserDefined, resolve, reject))
			})
		})
	}

	/**
	 * Send the inquiry defined by `inquiry`, then start asynchronous processing
	 * of its response.
	 *
	 * Don't wait for preceding messages' responses to be processed before
	 * sending the inquiry: some commands (for example, recalling presets) only
	 * receive a full response after a delay, and it isn't acceptable to delay
	 * all manipulations (for example, to quickly recall a different preset
	 * after a wrong button was fat-fingered) for that entire time.
	 *
	 * This function implicitly waits for the connection to be fully established
	 * as if `await this.connect()` had occurred.
	 *
	 * @param inquiry
	 *    The inquiry to send.
	 * @returns
	 *    A promise that resolves after the response to `inquiry` (which may be
	 *    an error response) has been processed.  If the inquiry failed, an
	 *    `Error` is resolved; if the inquiry succeeded, the promise resolves
	 *    the corresponding options.
	 */
	async sendInquiry(inquiry: Inquiry): Promise<CompanionOptionValues | Error> {
		const messageBytes = inquiry.toBytes()
		const isUserDefined = inquiry.isUserDefined()
		return this.#sendMessage('inquiry', isUserDefined, messageBytes).then(async (result: void | Error) => {
			if (result !== undefined) {
				return result
			}

			return new Promise((resolve: InquiryResolve, reject: MessageRejectFatally) => {
				this.#waitingForInitialResponse.push(
					new PendingInquiry(messageBytes, isUserDefined, resolve, reject, inquiry.response()),
				)
			})
		})
	}

	/** Send a message of the given type and bytes. */
	async #sendMessage(type: MessageType, userDefined: boolean, messageBytes: readonly number[]): Promise<void | Error> {
		const err = checkCommandBytes(messageBytes)
		if (err !== null) {
			// The bytes should already have been validated, so if this is hit,
			// it's always an error.
			let msg = `Attempt to send invalid ${type} ${prettyBytes(messageBytes)}: ${err}.`
			if (!userDefined) {
				msg += `  ${BLAME_MODULE}`
			}
			this.#instance.log('error', msg)
			return new Error(msg)
		}

		const socket = this.#socket
		if (socket === null) {
			return this.#errorWhileProcessingMessage(`Socket not open to send ${type}`, messageBytes)
		}
		if (this.#connectionStatus.type === 'connecting') {
			try {
				await this.#connectionStatus.open
			} catch (err) {
				if (err instanceof Error) {
					return err
				}
				return new Error(`Error waiting for connection to open: ${err}`)
			}
		}

		return this.#sendBytes(socket, messageBytes)
	}

	/** Write the supplied bytes to the socket. */
	async #sendBytes(socket: TCPHelper, message: readonly number[]): Promise<void | Error> {
		if (this.#instance.debugLogging) {
			this.#instance.log('info', `SEND: ${prettyBytes(message)}...`)
		}
		const sent = await socket.send(Buffer.from(message))
		if (!sent) {
			return new Error('Data not sent: socket is closed')
		}
		return undefined
	}
}
