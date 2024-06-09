import type {
	CompanionActionContext,
	CompanionActionDefinition,
	CompanionActionInfo,
	CompanionInputFieldTextInput,
	CompanionOptionValues,
} from '@companion-module/base'
import { PtzOpticsActionId } from './actions-enum.js'
import type { PtzOpticsInstance } from './instance.js'
import { type CommandParams, type PartialCommandParams, UserDefinedCommand } from './visca/command.js'

/** Parse a VISCA message string into an array of byte values. */
function parseMessage(msg: string): readonly number[] {
	const hexData = msg.replace(/\s+/g, '')
	const command = []
	for (let i = 0; i < hexData.length; i += 2) {
		command.push(parseInt(hexData.substr(i, 2), 16))
	}
	return command
}

/**
 * The isVisible callback for inputs that correspond to parameters in the
 * command.
 */
function commandParameterInputIsVisible(options: CompanionOptionValues, i: number): boolean {
	const commandParams = String(options['command_parameters'])
	if (commandParams === '') {
		return false
	}

	// This must be a local, uninherited, duplicated constant because
	// isVisible functions are converted to and from string.
	const PARAMETERS_SPLITTER = /; ?/g

	const commandParamCount = commandParams.split(PARAMETERS_SPLITTER).length
	return i < commandParamCount
}

// Pan Tilt:Pan Tilt Drive:RelativePosition has 4 parameters.
// 81 01 06 03 vv ww 0y 0y 0y 0y 0z 0z 0z 0z FF
const MAX_PARAMETERS_IN_COMMAND = 4

const CommandParameterDefault = ''

/**
 * Generate text inputs corresponding to values to set in parameters of the
 * command.
 */
function generateInputsForCommandParameters(): CompanionInputFieldTextInput[] {
	const inputs: CompanionInputFieldTextInput[] = []
	for (let i = 0; i < MAX_PARAMETERS_IN_COMMAND; i++) {
		inputs.push({
			type: 'textinput',
			id: `parameter${i}`,
			label: `Command parameter #${i + 1}`,
			default: CommandParameterDefault,
			useVariables: true,
			isVisibleData: i,
			isVisible: commandParameterInputIsVisible,
		})
	}
	return inputs
}

/**
 * Add option values for command parameters to "Custom command" action options
 * that lack them.
 */
function addCommandParameterDefaults(options: CompanionOptionValues): void {
	for (let i = 0; i < MAX_PARAMETERS_IN_COMMAND; i++) {
		options[`parameter${i}`] = CommandParameterDefault
	}
}

const PARAMETERS_SPLITTER = /; ?/g
const NIBBLES_SPLITTER = /, ?/g

/**
 * Parse a message parameters string (like "5" or "6,7" or "8; 10,12; 13") into
 * an array of parameters, each of which is an array of half-byte offsets into a
 * VISCA message.
 *
 * @param command
 *    The message to which the parameters information is being applied
 * @param parametersString
 *    A parameters string: a semicolon-separated list of comma-separated lists
 *    of nibble offsets, all nibble offsets being unique and referring to
 *    nibbles in `command` that are zero.
 */
function parseParameters(command: readonly number[], parametersString: string): readonly number[][] {
	if (parametersString === '') return []

	const params = parametersString.split(PARAMETERS_SPLITTER)

	// Parse.
	const parameters = params.map((parameterString) => {
		return parameterString.split(NIBBLES_SPLITTER).map((ds) => parseInt(ds, 10))
	})

	// Validate.
	const seen = new Set<number>()
	for (const nibbles of parameters) {
		for (const nibble of nibbles) {
			if (nibble < 2 || 2 * command.length - 2 <= nibble) {
				throw new RangeError(`offset ${nibble} is out of range`)
			}
			if (seen.has(nibble)) {
				throw new RangeError(`offset ${nibble} appears multiple times in parameters`)
			}

			const b = command[nibble >> 1]
			const mask = nibble % 2 === 0 ? 0xf0 : 0x0f
			if ((b & mask) !== 0) {
				throw new RangeError(`half-byte at offset ${nibble} is nonzero`)
			}

			seen.add(nibble)
		}
	}

	return parameters
}

const CommandParametersOptionId = 'command_parameters'
const CommandParametersDefault = ''

/**
 * Determine whether the given action information corresponds to a "Custom
 * command" action consisting only of a byte sequence, missing options that
 * specify no parameters are present in it.
 */
export function isCustomCommandMissingCommandParameterOptions(action: CompanionActionInfo): boolean {
	return action.actionId === PtzOpticsActionId.SendCustomCommand && !(CommandParametersOptionId in action.options)
}

/**
 * At one time, the "Custom command" action took only a single option with id
 * "custom" specifying the bytes to send.
 *
 * Now, the "Custom command" action supports user-defined parameters in the
 * command being sent.
 *
 * Add option values that specify "no parameters" to old-school `options` that
 * lack them.
 */
export function addCommandParameterOptionsToCustomCommandOptions(options: CompanionOptionValues): void {
	options[CommandParametersOptionId] = CommandParametersDefault
	addCommandParameterDefaults(options)
}

const COMMAND_REGEX = '/^81 ?(?:[0-9a-fA-F]{2} ?){3,13}[fF][fF]$/'

type CommandAndOptions = {
	command: UserDefinedCommand
	options: CompanionOptionValues
}

/**
 * Given the `options` for a "Custom command" action, compute the
 * `UserDefinedCommand` and `CompanionOptionValues` that can be used to send the
 * command.
 */
export async function computeCustomCommandAndOptions(
	options: CompanionOptionValues,
	context: CompanionActionContext
): Promise<CommandAndOptions> {
	const commandBytes = parseMessage(String(options['custom']))

	const commandParams: CommandParams = parseParameters(commandBytes, String(options['command_parameters'])).reduce(
		(acc, nibbles, i) => {
			acc[`${i}`] = {
				nibbles,
				choiceToParam: Number,
			}

			return acc
		},
		{} as PartialCommandParams
	)

	const command = new UserDefinedCommand(commandBytes, commandParams)

	const commandOpts: CompanionOptionValues = {}
	for (const i of Object.keys(commandParams)) {
		const val = await context.parseVariablesInString(String(options[`parameter${i}`]))
		commandOpts[i] = val
	}

	return { command, options: commandOpts }
}

/**
 * Generate an action definition for the "Custom command" action.
 */
export function generateCustomCommandAction(instance: PtzOpticsInstance): CompanionActionDefinition {
	const PARAMETER_LIST_REGEX = '/^(?:[0-9]+(?:, ?[0-9]+)*(?:; ?[0-9]+(?:, ?[0-9]+)*)*|)$/'

	return {
		name: 'Custom command',
		description:
			'Send a command of custom bytes (with embedded parameters filled ' +
			'by user-defined expression) to the camera.  The camera must ' +
			'respond with the standard ACK + Completion response to the ' +
			'command or with an error.  Refer to PTZOptics VISCA over IP ' +
			'command documentation for command structure details.',
		options: [
			{
				type: 'textinput',
				label: 'Bytes of the command (set all parameter half-bytes to zeroes)',
				id: 'custom',
				regex: COMMAND_REGEX,
			},
			{
				type: 'textinput',
				label: 'Parameter locations in command',
				id: CommandParametersOptionId,
				regex: PARAMETER_LIST_REGEX,
				tooltip:
					'The parameter list must be separated by semicolons.  ' +
					'Each parameter should be a comma-separated sequence of ' +
					'half-byte offsets into the command.  Offsets must not ' +
					'be reused.',
				default: CommandParametersDefault,
			},
			...generateInputsForCommandParameters(),
		],
		callback: async ({ options }, context) => {
			const { command, options: commandOpts } = await computeCustomCommandAndOptions(options, context)
			void instance.sendCommand(command, commandOpts)
		},
	}
}
