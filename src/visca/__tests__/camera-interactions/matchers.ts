import { prettyBytes } from '../../utils.js'

export function MatchVISCABytes(bytes: readonly number[]): RegExp {
	return new RegExp(`\\[${prettyBytes(bytes).slice(1, -1)}\\]`)
}

export const CantBeExecutedNowMatcher = /can't be executed now/
export const NotExecutableWithNoCommandsAwaitingInitialResponseMatcher =
	/^Received Command Not Executable with no commands awaiting initial response/
export const BlameModuleMatcher = /This is likely a bug in the ptzoptics-visca Companion module./

export const CameraReportedSyntaxErrorMatcher = /^Camera reported a syntax error in the message/

export function CompletionInEmptySocketMatcher(y: number): RegExp {
	return new RegExp(`^Received Completion for socket ${y}, but no command is executing in it`)
}

export const BadReturnStartByteMatcher =
	/^Error in camera response: return message data doesn't start with 0x90 \(VISCA bytes \[[0-9A-Z]{2}(?: [0-9A-Z]{2})*\]\)$/

export const UserDefinedInquiryMatcher = /Double-check the syntax of your inquiry./
export const UserDefinedMessageMatcher = /Double-check the syntax of the message./

export const InquiryResponseWithoutInquiryMatcher = /^Received inquiry response without a pending inquiry/

export const ErrorOfUnexpectedLengthMatcher = /^Encountered error response of unexpected length/
export const UnrecognizedErrorMatcher = /^Received error response to \[[0-9A-Z ]+\] with unrecognized format/

export const SocketClosedMatcher = 'Message not fully processed: socket was closed'

export const AttemptSendInvalidMatcher = /^Attempt to send invalid /

export const UnrecognizedFormatMatcher = /^Received response with unrecognized format/
export const ACKWithoutPendingCommandMatcher = /^Received ACK without a pending command/
export const InquiryResponseIncompatibleMatcher =
	/^Inquiry .* received the response .* which isn't compatible with the expected format/
export const CommandBufferFullMatcher = /^Command buffer full: .* was not executed$/
export const NoMessagesAwaitingInitialResponseMatcher = /^Unexpected error with no messages awaiting initial response/
