import { assertNever, type CompanionOptionValues, InstanceStatus, type LogLevel } from '@companion-module/base'
import { type Interaction, type Match } from './interactions.js'
import net from 'net'
import { type MessageType, type PartialInstance, VISCAPort } from '../../port.js'
import { prettyBytes } from '../../utils.js'

/** Turn on extra logging in performing test interactions to debug tests. */
const DEBUG_LOGGING = true

/** Log the given message if interaction-test debugging is enabled. */
function LOG(msg: string): void {
	if (DEBUG_LOGGING) {
		console.log(msg)
	}
}

/** Generate a debug representation of a value. */
function repr(val: undefined | number | string | boolean | readonly (string | number)[]): string {
	if (val === undefined) {
		return 'undefined'
	}
	return JSON.stringify(val)
}

/**
 * Compare the expected response to an inquiry against the actual response, and
 * throw if there's any mismatch.
 */
function checkInquirySucceeded(expectedResponse: CompanionOptionValues, actualResponse: CompanionOptionValues) {
	function sortedOptionsEntries(options: CompanionOptionValues) {
		return Object.entries(options).sort((e1, e2) => {
			if (e1[0] < e2[0]) {
				return -1
			}
			if (e1[0] > e2[0]) {
				return 1
			}
			return 0
		})
	}

	const expectedEntries = sortedOptionsEntries(expectedResponse)
	const actualEntries = sortedOptionsEntries(actualResponse)
	if (expectedEntries.length !== actualEntries.length) {
		throw new Error('Expected/actual response have different numbers of parameters')
	}
	for (let i = 0; i < expectedEntries.length; i++) {
		const [[expectedName, expectedValue], [actualName, actualValue]] = [expectedEntries[i], actualEntries[i]]
		if (expectedName !== actualName) {
			throw new Error(`Parameter mismatch: expected ${repr(expectedName)}, got ${repr(actualName)}`)
		}
		if (!Object.is(expectedValue, actualValue)) {
			let msg = `Parameter ${repr(expectedName)}: `
			msg += `expected ${repr(expectedValue)}, got ${repr(actualValue)}`
			throw new Error(msg)
		}
	}
}

type LogWaiter = {
	readonly regex: RegExp
	readonly resolve: () => void
}

/**
 * A mock instance that performs `InstanceBase` logging and tracks status
 * updates.
 */
class MockInstance implements PartialInstance {
	priorStatuses: InstanceStatus[] = []
	currentStatus = InstanceStatus.UnknownError

	logWaiter: LogWaiter | null = null

	log = (level: LogLevel, msg: string) => {
		LOG(`Log (${level}): ${msg}`)
		if (this.logWaiter && this.logWaiter.regex.test(msg)) {
			this.logWaiter.resolve()
			this.logWaiter = null
		}
	}

	updateStatus(status: InstanceStatus, message?: string): void {
		LOG(`Status update: ${status}${typeof message === 'string' ? `, message ${message}` : ''}`)
		this.currentStatus = status
		this.priorStatuses.push(status)
	}

	readonly debugLogging = true // log everything during tests

	checkPriorStatuses(expectedStatuses: readonly InstanceStatus[]): void {
		if (
			expectedStatuses.length !== this.priorStatuses.length ||
			!expectedStatuses.every((expectedStatus: InstanceStatus, i: number) => this.priorStatuses[i] === expectedStatus)
		) {
			throw new Error(`Prior statuses ${repr(this.priorStatuses)} failed to match ${repr(expectedStatuses)}`)
		}

		this.priorStatuses.length = 0
	}

	async waitForLog(regex: RegExp): Promise<void> {
		LOG(`Waiting for log message matching ${repr(regex.source)}...`)
		if (this.logWaiter !== null) {
			throw new Error("Shouldn't be waiting for multiple log messages")
		}

		return new Promise<void>((resolve: () => void) => {
			this.logWaiter = {
				regex,
				resolve,
			}
		})
	}
}

/** Generate a debug representation of a `Match`. */
function reprMatch(match: Match): string {
	if (typeof match === 'string') {
		return repr(match)
	}

	if (match instanceof RegExp) {
		return match.toString()
	}

	return `[${match.map((regex) => regex.toString()).join(', ')}]`
}

/** Return whether `match` matches `s`. */
function matches(match: Match, s: string): boolean {
	if (typeof match === 'string') {
		return match === s
	}

	const regexes = match instanceof RegExp ? [match] : match
	let matched = true
	for (const regex of regexes) {
		matched &&= regex.test(s)
	}
	return matched
}

/** Throw if the given `Match` doesn't match `s`. */
function checkMatch(type: MessageType, match: Match, s: string) {
	if (!matches(match, s)) {
		const msg = `Expected ${type} to fail matching ${reprMatch(match)}, instead was ${repr(s)}`
		throw new Error(msg)
	}
}

/**
 * Throw indicating an expected failure -- that is fatal if `fatal` -- with the
 * given match, when the command/inquiry actually succeeded.
 */
function requireFailWhenSucceeded(type: MessageType, fatal: boolean, match: Match): void {
	const msg = `Expected ${type} to fail${fatal ? ' fatally' : ''} matching ${reprMatch(match)}, instead succeeded`
	throw new Error(msg)
}

/**
 * Throw indicating an expected fatal failure with the given match, but the
 * command/inquiry actually failed nonfatally with the given message.
 */
function requireFatalFailureWhenFailed(type: MessageType, match: Match, message: string): void {
	const msg = `Expected ${type} to fail fatally matching ${reprMatch(
		match,
	)}, instead failed nonfatally with message ${repr(message)}`
	throw new Error(msg)
}

/**
 * Throw indicating an expected nonfatal failure with the given match, when the
 * command/inquiry actually failed fatally with the given message.
 */
function requireNonfatalFailureWhenFatal(type: MessageType, match: Match, message: string): void {
	const msg = `Expected ${type} to fail matching ${reprMatch(match)}, instead failed fatally with message ${repr(
		message,
	)}`
	throw new Error(msg)
}

/**
 * Throw indicating expected success, but instead the command/message failed --
 * fatally if `fatal` -- with the given message.
 */
function requireSucceedWhenFailed(type: MessageType, fatal: boolean, message: string): void {
	const msg = `Expected ${type} to succeed, instead failed${fatal ? ' fatally' : ''} with ${repr(message)}`
	throw new Error(msg)
}

/** A mock camera for a single `RunCameraInteractionTest`. */
type Camera = {
	/**
	 * The socket corresponding to the incoming client connection to this
	 * "camera" during a `RunCameraInteractionTest`.  Bytes written to this
	 * socket will be received by the `VISCAPort` client.
	 */
	socket: net.Socket

	/**
	 * Read a count of bytes sent by the client to the camera, blocking until
	 * the desired number of bytes can be consumed.
	 *
	 * Passing a negative `amount` consumes and returns all currently-received
	 * bytes.
	 */
	readIncomingBytes: (amount: number) => Promise<readonly number[]>

	/**
	 * A promise that resolves when the "camera"'s incoming connection socket
	 * closes, resolving `true` if there was a connection error (i.e. the
	 * `VISCAPort` was manually closed, terminating the connection) and `false`
	 * otherwise.
	 */
	socketClosed: Promise<boolean>
}

/**
 * Perform the interactions specified by `interactions` using a fresh
 * `VISCAPort`.
 *
 * @param server
 *   A server that performs the functions of a mock camera.
 * @param port
 *   The TCP port the camera mocked by `server` is running on.
 * @param interactions
 *   An array of the interactions to perform.  The array must be "complete" in
 *   that all sent commands and inquiries must have their responses expected and
 *   all bytes sent to the camera must have been accounted for.
 * @param finalStatus
 *    The expected status of `instance` after all interactions have completed.
 */
async function verifyInteractions(
	server: net.Server,
	port: number,
	interactions: readonly Interaction[],
	finalStatus: InstanceStatus,
): Promise<void> {
	const instance = new MockInstance()
	const clientViscaPort = new VISCAPort(instance)

	const camera = new Promise<Camera>((resolve: (camera: Camera) => void) => {
		server.once('connection', (socket: net.Socket) => {
			LOG(`Server received connection on port ${socket.localPort}`)

			const socketClosed = new Promise<boolean>((resolve: (hadError: boolean) => void) => {
				socket.once('close', (hadError: boolean) => {
					resolve(hadError)
				})
			})

			const cameraIncomingBytes: number[] = []
			let cameraSocketError = false
			socket.once('error', (_err: Error) => {
				cameraSocketError = true
			})

			let cameraReceivedMoreBytes = (async function cameraWaitToReceiveBytes() {
				return new Promise<void>((resolve: () => void) => {
					socket.once('data', (data: Buffer) => {
						if (cameraSocketError) {
							return
						}

						cameraIncomingBytes.push(...data)
						resolve()

						cameraReceivedMoreBytes = cameraWaitToReceiveBytes()
					})
				})
			})()

			async function readIncomingBytes(amount: number): Promise<readonly number[]> {
				if (amount < 0) {
					amount = cameraIncomingBytes.length
				}
				while (cameraIncomingBytes.length < amount) {
					await cameraReceivedMoreBytes
				}
				return cameraIncomingBytes.splice(0, amount)
			}

			const camera = { socket, readIncomingBytes, socketClosed }
			resolve(camera)
		})
	})

	// Unless the VISCAPort is closed, the socket that the camera sees shouldn't
	// close with an error.
	let cameraSocketCloseExpectsError = false

	// NOTE: This doesn't wait for the connection to be fully established.
	//       Operations must either implicitly wait for it to be established or
	//       `connect()` must be awaited.
	clientViscaPort.open('127.0.0.1', port)

	try {
		const sentCommands: Map<string, Promise<void | Error>> = new Map()
		const sentInquiries: { inquiry: Promise<CompanionOptionValues | Error>; id: string }[] = []

		for (const interaction of interactions) {
			LOG(`Processing ${interaction.type} interaction`)
			const { type } = interaction
			switch (type) {
				case 'send-camera-command': {
					const { command, options, id } = interaction
					if (sentCommands.has(id)) {
						throw new Error("Can't use duplicated command ids")
					}
					sentCommands.set(id, clientViscaPort.sendCommand(command, options))
					break
				}
				case 'send-camera-inquiry': {
					const { inquiry, id } = interaction
					sentInquiries.push({ inquiry: clientViscaPort.sendInquiry(inquiry), id })
					break
				}
				case 'camera-expect-incoming-bytes': {
					const { bytes: expectedBytes } = interaction
					LOG(`Camera receiving ${expectedBytes.length} bytes`)
					const incomingBytes = await (await camera).readIncomingBytes(expectedBytes.length)
					if (
						!incomingBytes.every((v: number, i: number) => {
							return v === expectedBytes[i]
						})
					) {
						let reason = `Expected to receive ${prettyBytes(expectedBytes)}`
						reason += `, got ${prettyBytes(incomingBytes)}`
						throw new Error(reason)
					}
					break
				}
				case 'camera-reply': {
					const { bytes } = interaction
					if (!(await camera).socket.write(bytes)) {
						throw new Error(`Writing ${prettyBytes(bytes)} failed, socket closed`)
					}
					LOG(`Wrote ${prettyBytes(bytes)} to socket`)
					break
				}
				case 'command-succeeded': {
					const { id } = interaction
					const command = sentCommands.get(id)
					if (command === undefined) {
						throw new Error(`No pending ${id} command`)
					} else {
						sentCommands.delete(id)
					}
					await command.then(
						(res: void | Error) => {
							if (res instanceof Error) {
								requireSucceedWhenFailed('command', false, res.message)
							} else {
								// succeeded
							}
						},
						(reason: Error) => {
							requireSucceedWhenFailed('command', true, reason.message)
						},
					)
					break
				}
				case 'command-failed': {
					const { match, id } = interaction
					const command = sentCommands.get(id)
					if (command === undefined) {
						throw new Error(`No pending ${id} command`)
					} else {
						sentCommands.delete(id)
					}
					await command.then(
						(res: void | Error) => {
							if (res === undefined) {
								requireFailWhenSucceeded('command', false, match)
							} else {
								checkMatch('command', match, res.message)
							}
						},
						(reason: Error) => {
							requireNonfatalFailureWhenFatal('command', match, reason.message)
						},
					)
					break
				}
				case 'command-failed-fatally': {
					const { match, id } = interaction
					const command = sentCommands.get(id)
					if (command === undefined) {
						throw new Error(`No pending ${id} command`)
					} else {
						sentCommands.delete(id)
					}
					await command.then(
						(res: void | Error) => {
							if (res === undefined) {
								requireFailWhenSucceeded('command', true, match)
							} else {
								requireFatalFailureWhenFailed('command', match, res.message)
							}
						},
						(reason: Error) => {
							checkMatch('command', match, reason.message)
						},
					)
					break
				}
				case 'inquiry-succeeded': {
					const { response: expectedResponse, id } = interaction
					const inquiryInfo = sentInquiries.shift()
					if (inquiryInfo === undefined) {
						throw new Error('No unexamined sent inquiries to examine')
					}
					const { inquiry, id: actualId } = inquiryInfo
					if (id !== actualId) {
						throw new Error(`Expectation mismatch: expecting ${id} but got ${actualId}`)
					}
					await inquiry.then(
						(res: CompanionOptionValues | Error) => {
							if (res instanceof Error) {
								throw new Error(`Expected inquiry to succeed, instead failed: ${repr(res.message)}`)
							} else {
								checkInquirySucceeded(expectedResponse, res)
							}
						},
						(reason: Error) => {
							requireSucceedWhenFailed('inquiry', true, reason.message)
						},
					)
					break
				}
				case 'inquiry-failed': {
					const { match, id } = interaction
					const inquiryInfo = sentInquiries.shift()
					if (inquiryInfo === undefined) {
						throw new Error('No unexamined sent inquiry to examine')
					}
					const { inquiry, id: actualId } = inquiryInfo
					if (id !== actualId) {
						throw new Error(`Expectation mismatch: expecting ${id} but got ${actualId}`)
					}
					await inquiry.then(
						(res: CompanionOptionValues | Error) => {
							if (res instanceof Error) {
								checkMatch('inquiry', match, res.message)
							} else {
								requireFailWhenSucceeded('inquiry', false, match)
							}
						},
						(reason: Error) => {
							requireNonfatalFailureWhenFatal('inquiry', match, reason.message)
						},
					)
					break
				}
				case 'inquiry-failed-fatally': {
					const { match, id } = interaction
					const inquiryInfo = sentInquiries.shift()
					if (inquiryInfo === undefined) {
						throw new Error('No unexamined sent inquiry to examine')
					}
					const { inquiry, id: actualId } = inquiryInfo
					if (id !== actualId) {
						throw new Error(`Expectation mismatch: expecting ${id} but got ${actualId}`)
					}
					await inquiry.then(
						(res: CompanionOptionValues | Error) => {
							if (res instanceof Error) {
								requireFatalFailureWhenFailed('inquiry', match, res.message)
							} else {
								requireFailWhenSucceeded('inquiry', true, match)
							}
						},
						(reason: Error) => {
							checkMatch('inquiry', match, reason.message)
						},
					)
					break
				}
				case 'check-instance-status': {
					const { status: expectedStatus } = interaction
					if (expectedStatus !== instance.currentStatus) {
						let msg = `Expected current status ${expectedStatus}, `
						msg += `instead was ${instance.currentStatus}`
						throw new Error(msg)
					}
					break
				}
				case 'check-prior-statuses': {
					instance.checkPriorStatuses(interaction.statuses)
					break
				}
				case 'close-visca-port': {
					clientViscaPort.close('close-visca-port', InstanceStatus.Disconnected)
					cameraSocketCloseExpectsError = true
					break
				}
				case 'wait-for-connection': {
					const beforeStatus = instance.currentStatus
					if (![InstanceStatus.Connecting, InstanceStatus.Ok].includes(beforeStatus)) {
						throw new Error(`Connection should be connecting or connected, instead was ${repr(beforeStatus)}`)
					}

					await clientViscaPort.connect()

					const afterStatus = instance.currentStatus
					if (afterStatus !== InstanceStatus.Ok) {
						throw new Error(`Instance status should be Ok after connect(), was ${repr(afterStatus)}`)
					}
					break
				}
				case 'camera-disconnect': {
					const socket = (await camera).socket
					// This is a graceful disconnect (as such things go), so
					// VISCAPort won't observe it as a socket error, rather as
					// a socket end.
					socket.end()
					break
				}
				case 'wait-for-log-message': {
					const { regex } = interaction
					await instance.waitForLog(regex)
					break
				}
				default:
					assertNever(type)
					break
			}
		}

		if (instance.currentStatus !== finalStatus) {
			const msg = `Expected final status ${finalStatus} but got ${instance.currentStatus}`
			throw new Error(msg)
		}

		if (sentInquiries.length > 0) {
			throw new Error('Failed to expect a result for every sent inquiry')
		}
		if (sentCommands.size > 0) {
			throw new Error('Failed to expect a result for every sent command')
		}
	} catch (e) {
		console.log(`Running interactions threw: ${e}`)
		if (e instanceof Error) {
			throw e
		} else {
			throw new Error(`Interactions threw error: ${e}`)
		}
	} finally {
		LOG('interaction testing finished')
		clientViscaPort.close('Interaction testing finished', InstanceStatus.Disconnected)

		const { socketClosed: cameraSocketClosed } = await camera

		const hadErrorClosingCameraSocket = await cameraSocketClosed

		await new Promise<void>((resolve: () => void, reject: (err: Error) => void) => {
			server.close(() => {
				if (hadErrorClosingCameraSocket !== cameraSocketCloseExpectsError) {
					let msg = 'camera socket unexpectedly closed '
					msg += `with${hadErrorClosingCameraSocket ? '' : 'out'} error`
					reject(new Error(msg))
				} else {
					resolve()
				}
			})
		})
	}

	const leftoverCameraIncomingBytes = await (await camera).readIncomingBytes(-1)
	if (leftoverCameraIncomingBytes.length > 0) {
		throw new Error(`Camera received unexpected excess bytes: ${prettyBytes(leftoverCameraIncomingBytes)}`)
	}
}

/**
 * Run the provided series of interactions to verify ensuing behavior.
 *
 * @param interactions
 *    The series of interactions (commands/inquiries to the "camera", responses
 *    "from" it) to perform and check ongoing state, using a freshly spun-up
 *    `VISCAPort`.  The interactions must consume all bytes sent through the
 *    port and define expectations for every sent command and inquiry.
 */
export async function RunCameraInteractionTest(
	interactions: readonly Interaction[],
	finalStatus: InstanceStatus,
): Promise<void> {
	type ServerInfo = {
		server: net.Server
		port: number
	}

	// Spin up a server to act as a fake camera.
	const { server, port } = await new Promise<ServerInfo>(
		(resolve: ({ server, port }: ServerInfo) => void, reject: (err: Error) => void) => {
			const server = net.createServer({ noDelay: true })

			server.on('error', (err: Error) => {
				LOG(`Server had an error: ${err}`)
				reject(err)
			})

			const randomlyChosenPort = 0
			server.listen(randomlyChosenPort, () => {
				const addr = server.address()
				if (typeof addr === 'string' || addr === null) {
					reject(new Error('server not running on an IP socket?'))
					return
				}

				const port = addr.port
				LOG(`Server listening for incoming connections on port ${port}`)
				resolve({ server, port: addr.port })
			})
		},
	)

	return verifyInteractions(server, port, interactions, finalStatus)
}
