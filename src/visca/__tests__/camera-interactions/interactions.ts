import type { CompanionOptionValues, InstanceStatus } from '@companion-module/base'
import type { Command, Inquiry } from '../../command.js'
import type { Bytes } from '../../../utils/byte.js'

/**
 * A matcher defining the expected error message for a fatal or nonfatal failed
 * command/inquiry
 *
 *   * A string matches if it is equal to the message.
 *   * A single RegExp matches if the regular expression matches.
 *   * An array of RegExps matches if all regular expressions in the array
 *     match.
 */
export type Match = string | RegExp | readonly RegExp[]

type SendCameraCommand = {
	readonly type: 'send-camera-command'
	readonly command: Command
	readonly options: CompanionOptionValues | null
	readonly id: string
}

type SendCameraInquiry = {
	readonly type: 'send-camera-inquiry'
	readonly inquiry: Inquiry
	readonly id: string
}

type CameraIncomingBytes = {
	readonly type: 'camera-expect-incoming-bytes'
	readonly bytes: Bytes
}

type CameraReply = {
	readonly type: 'camera-reply'
	readonly bytes: Bytes
}

type CommandSuccess = {
	readonly type: 'command-succeeded'
	readonly id: string
}

type CommandFailure = {
	readonly type: 'command-failed'
	readonly match: Match
	readonly id: string
}

type CommandFatalFailure = {
	readonly type: 'command-failed-fatally'
	readonly match: Match
	readonly id: string
}

type InquirySuccess = {
	readonly type: 'inquiry-succeeded'
	readonly response: CompanionOptionValues
	readonly id: string
}

type InquiryFailure = {
	readonly type: 'inquiry-failed'
	readonly match: Match
	readonly id: string
}

type InquiryFatalFailure = {
	readonly type: 'inquiry-failed-fatally'
	readonly match: Match
	readonly id: string
}

type InstanceStatusCheck = {
	readonly type: 'check-instance-status'
	readonly status: InstanceStatus
}

type PriorStatusesCheck = {
	readonly type: 'check-prior-statuses'
	readonly statuses: readonly InstanceStatus[]
}

type CloseVISCAPort = {
	readonly type: 'close-visca-port'
}

type WaitForConnection = {
	readonly type: 'wait-for-connection'
}

type CameraDisconnect = {
	readonly type: 'camera-disconnect'
}

type WaitLogMessage = {
	readonly type: 'wait-for-log-message'
	readonly regex: RegExp
}

/**
 * An interaction to perform during a camera interaction sequence test using
 * `RunCameraInteractionTest`.
 */
export type Interaction =
	| SendCameraCommand
	| SendCameraInquiry
	| CameraIncomingBytes
	| CameraReply
	| CommandSuccess
	| CommandFailure
	| CommandFatalFailure
	| InquirySuccess
	| InquiryFailure
	| InquiryFatalFailure
	| InstanceStatusCheck
	| PriorStatusesCheck
	| CloseVISCAPort
	| WaitForConnection
	| CameraDisconnect
	| WaitLogMessage

/**
 * Send a command that has options through the VISCA port.
 *
 * @param command
 *    The command to send.
 * @param options
 *    Compatible options to use to generate the bytes sent to the "camera".
 * @param id
 *    An identifier to associate with this command.  The same identifier must be
 *    specified when the command is eventually expected .
 */
export function SendCommand(command: Command, options: CompanionOptionValues, id: string): SendCameraCommand
/**
 * Send a command with no options through the VISCA port.
 *
 * @param command
 *    The command to send.
 * @param id
 *    An identifier to associate with this command.  The same identifier must be
 *    specified when the command is eventually expected .
 */
export function SendCommand(command: Command, id: string): SendCameraCommand
export function SendCommand(
	command: Command,
	optsOrId: CompanionOptionValues | string,
	optionalId?: string,
): SendCameraCommand {
	let options, id
	if (typeof optsOrId === 'string') {
		options = {}
		id = optsOrId
	} else if (typeof optionalId === 'string') {
		options = optsOrId
		id = optionalId
	} else {
		throw new Error('bad SendCommand arguments')
	}
	return { type: 'send-camera-command', command, options, id }
}

/**
 * Send an inquiry through the VISCA port.
 *
 * @param inquiry
 *    The inquiry to send.
 * @param id
 *    An identifier to associate with this inquiry.  The same identifier must be
 *    specified when the inquiry is eventually expected .
 */
export function SendInquiry(inquiry: Inquiry, id: string): SendCameraInquiry {
	return { type: 'send-camera-inquiry', inquiry, id }
}

/**
 * Expect the given bytes to have been sent to the camera.  (It's fine if more
 * bytes than these have been sent at this time, as long as these bytes are the
 * earliest-sent bytes that have not yet been indicated to be expected.)
 */
export function CameraExpectIncomingBytes(bytes: Bytes): CameraIncomingBytes {
	return { type: 'camera-expect-incoming-bytes', bytes }
}

/**
 * The lead byte of a network change reply: `z0` where `z` is a nibble whose
 * high bit is set.
 */
type NetworkChangeFirstByte = 0x80 | 0x90 | 0xa0 | 0xb0 | 0xc0 | 0xd0 | 0xe0 | 0xf0

/**
 * Make the "camera" send a Network Change Reply identifying as the desired
 * camera.
 *
 * These messages aren't sent by PTZOptics cameras, but some non-PTZOptics
 * cameras send them (despite that they serve no purpose with VISCA over IP).
 * This reply can be sprinkled pretty much anywhere in the stream of camera
 * replies, and the module should simply skip them.  (Note that if you want to
 * guarantee the skipping happens, you have to ensure that subsequent bytes sent
 * by the camera are depended upon in some fashion.)
 *
 * @param bytes
 *   A network change reply sequence: `z0 38 FF` where `z = Device address + 8`.
 */
export function CameraReplyNetworkChange(bytes: readonly [NetworkChangeFirstByte, 0x38, 0xff]): CameraReply {
	return { type: 'camera-reply', bytes }
}

/** Make the "camera" reply with the given bytes. */
export function CameraReplyBytes(bytes: Bytes): CameraReply {
	return { type: 'camera-reply', bytes }
}

/**
 * Expect the oldest not-yet-expected command to have succeeded.
 *
 * @param id
 *    The `id` that was supplied to `SendCommand` when the corresponding command
 *    was sent.
 */
export function CommandSucceeded(id: string): CommandSuccess {
	return { type: 'command-succeeded', id }
}

/**
 * Expect the oldest not-yet-expected command to fail.
 *
 * @param match
 * 	  A matcher that must match the returned error's message.
 * @param id
 *    The `id` that was supplied to `SendCommand` when the corresponding command
 *    was sent.
 */
export function CommandFailed(match: Match, id: string): CommandFailure {
	return { type: 'command-failed', match, id }
}

/**
 * Expect the oldest not-yet-expected command to fail fatally.
 *
 * @param match
 * 	  A matcher that must match the returned error's message.
 * @param id
 *    The `id` that was supplied to `SendCommand` when the corresponding command
 *    was sent.
 */
export function CommandFailedFatally(match: Match, id: string): CommandFatalFailure {
	return { type: 'command-failed-fatally', match, id }
}

/**
 * Expect the oldest not-yet-expected inquiry to succeed, resolving the given
 * option values.
 *
 * @param response
 *    An expected options object.  It must have the same properties as the
 *    actual options, and each of those properties must have the
 *    {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is|same value}.
 * @param id
 *    The `id` that was supplied to `SendInquiry` when the corresponding inquiry
 *    was sent.
 */
export function InquirySucceeded(response: CompanionOptionValues, id: string): InquirySuccess {
	return { type: 'inquiry-succeeded', response, id }
}

/**
 * Expect the oldest not-yet-expected inquiry to fail.
 *
 * @param match
 * 	  A matcher that must match the returned error's message.
 * @param id
 *    The `id` that was supplied to `SendInquiry` when the corresponding inquiry
 *    was sent.
 */
export function InquiryFailed(match: Match, id: string): InquiryFailure {
	return { type: 'inquiry-failed', match, id }
}

/**
 * Expect the oldest not-yet-expected inquiry to fail fatally.
 *
 * @param match
 * 	  A matcher that must match the returned error's message.
 * @param id
 *    The `id` that was supplied to `SendInquiry` when the corresponding inquiry
 *    was sent.
 */
export function InquiryFailedFatally(match: Match, id: string): InquiryFatalFailure {
	return { type: 'inquiry-failed-fatally', match, id }
}

/**
 * Expect that the instance status is currently `status`.
 *
 * Be careful to perform this only after a synchronizing interaction!  For
 * example, if this is used to assert a connection failure, it should be used
 * only after a prior command/inquiry whose execution causes the status change
 * to occur has been expected.
 */
export function InstanceStatusIs(status: InstanceStatus): InstanceStatusCheck {
	return { type: 'check-instance-status', status }
}

/**
 * Expect that the instance has transitioned through the given statuses so far
 * in the test -- since the last time status changes were checked with this
 * function, so that successive checks don't repeat a shared prefix.
 *
 * Be careful to perform this only after a synchronizing interaction!  For
 * example, if this is used to assert a connection failure, it should be used
 * only after a prior operation that causes the status change to occur has
 * happened -- and no further operations that might affect the status have
 * happened.
 *
 * @param statuses
 *   The expected statuses.
 */
export function CheckPriorStatuses(statuses: readonly InstanceStatus[]): PriorStatusesCheck {
	return { type: 'check-prior-statuses', statuses }
}

/**
 * Manually close the VISCA port spun up by this test.  (The automatic close at
 * finish of interactions will simply do nothing.)
 */
export function CloseVISCAPortEarly(): CloseVISCAPort {
	return { type: 'close-visca-port' }
}

/**
 * Wait for the port to be fully connected to the camera if it isn't already.
 * (It's allowed for the connection to already be established.)
 *
 * "Opening" a port doesn't wait for a connection to be established, in order
 * that it can complete quickly: subsequent actions that depend on full
 * connection will wait until an "opened" connection is established.  This
 * interaction manually performs that waiting; the only visible effect right now
 * is to guarantee the instance status is `Ok` and not possibly `Connecting`.
 */
export function WaitUntilConnectedToCamera(): WaitForConnection {
	return { type: 'wait-for-connection' }
}

/**
 * Make the camera close its TCP connection to the port.
 *
 * The port will fall into connection-failed state, but it then should attempt
 * to restart the TCP connection to get the instance working again (after
 * discarding any pending commands/inquiries).
 */
export function CameraDisconnection(): CameraDisconnect {
	return { type: 'camera-disconnect' }
}

/**
 * Wait until a log message that matches `regex` is logged.
 *
 * Note that by the time this interaction completes, additional log messages may
 * have been logged.  Therefore this interaction is best used to guarantee *at
 * least* a particular degree of progress, without guaranteeing that no
 * further progress has been made.
 *
 * @param regex
 * 	  The regular expression to test logged messages against.
 */
export function WaitForLogMessage(regex: RegExp): WaitLogMessage {
	return { type: 'wait-for-log-message', regex }
}
