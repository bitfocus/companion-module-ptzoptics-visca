import { CompanionOptionValues, InstanceStatus } from '@companion-module/base'
import { Command, Inquiry } from '../../command.js'
import { prettyBytes } from '../../utils.js'

/**
 * A matcher defining the expected error message for a fatal or nonfatal failed
 * command/inquiry
 *
 *   * A string matches if it is equal to the message.
 *   * A single RegExp matches if the regular expression matches.
 *   * An array of RegExps matches if all regular expressions in the array match.
 */
export type Match = string | RegExp | RegExp[]

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
	readonly bytes: readonly number[]
}

type CameraNetworkChangeReply = {
	readonly type: 'camera-network-change'
	readonly bytes: readonly [number, 0x38, 0xff]
}

type CameraReply = {
	readonly type: 'camera-reply'
	readonly bytes: Uint8Array
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

type CloseVISCAPort = {
	readonly type: 'close-visca-port'
}

type WaitForConnection = {
	readonly type: 'wait-for-connection'
}

/**
 * An interaction to perform during a camera interaction sequence test using
 * `RunCameraInteractionTest`.
 */
export type Interaction =
	| SendCameraCommand
	| SendCameraInquiry
	| CameraIncomingBytes
	| CameraNetworkChangeReply
	| CameraReply
	| CommandSuccess
	| CommandFailure
	| CommandFatalFailure
	| InquirySuccess
	| InquiryFailure
	| InquiryFatalFailure
	| InstanceStatusCheck
	| CloseVISCAPort
	| WaitForConnection

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
	optionalId?: string
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
export function CameraExpectIncomingBytes(bytes: readonly number[]): CameraIncomingBytes {
	return { type: 'camera-expect-incoming-bytes', bytes }
}

/**
 * Make the "camera" send a Network Change Reply identifying as the desired
 * camera.  (These must be the first reply bytes sent by the camera.)
 *
 * PTZOptics cameras don't send a Network Change Reply, but it appears that some
 * [non-PTZOptics](https://www.sony.net/Products/CameraSystem/CA/BRC_X400_SRG_X400/Technical_Document/E042100111.pdf)
 * [cameras](https://communication.aver.com/DownloadFile.aspx?n=5174%7C0C0D934C-A84C-423C-A14F-42C5F322C8AD&t=ServiceDownload)
 * send an initial "y0 38 FF" (y = Device address + 8) at startup to indicate
 * the camera's address to controllers.  (This device address is only meaningful
 * for VISCA *not* over IP, for example RS-232 with daisy-chained cameras, hence
 * why Sony cameras don't send it for VISCA over IP.  Other manufacturers'
 * cameras, it appears, are not so well-behaved.)
 *
 * As long as it's not harming the primary PTZOptics use case to skip this
 * initial network change reply, we might as well do it to allow using this
 * module with more cameras.
 *
 * @param bytes
 *   A network change reply sequence: `y0 38 FF` where `y = Device address + 8`.
 */
export function CameraInitialNetworkChangeReply(bytes: readonly [number, 0x38, 0xff]): CameraNetworkChangeReply {
	if ((bytes[0] & 0xff) !== bytes[0] || (bytes[0] & 0b1000_1111) !== 0b1000_0000) {
		throw new Error(`Bad lead byte in network change reply: ${prettyBytes(bytes)}`)
	}
	return { type: 'camera-network-change', bytes }
}

/** Make the "camera" reply with the given bytes. */
export function CameraReplyBytes(bytes: readonly number[]): CameraReply {
	return { type: 'camera-reply', bytes: new Uint8Array(bytes) }
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
