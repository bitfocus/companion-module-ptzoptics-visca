export const CantBeExecutedNowMatcher = /can't be executed now/
export const NotExecutableWithNoCommandsAwaitingInitialResponseMatcher =
	/^Received Command Not Executable with no commands awaiting initial response/
export const BlameModuleMatcher = /This is likely a bug in the ptzoptics-visca Companion module./

export function CompletionInEmptySocketMatcher(y: number): RegExp {
	return new RegExp(`^Received Completion for socket ${y}, but no command is executing in it`)
}
