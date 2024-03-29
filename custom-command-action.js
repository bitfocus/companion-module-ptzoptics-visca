import { CustomCommandActionId } from './actions.js'
import { UserDefinedCommand } from './visca/command.js'

/**
 * Parse a VISCA message string into an array of byte values.
 * @param {string} msg
 * @returns {number[]}
 */
function parseMessage(msg) {
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
 * @param {CompanionOptionValues} options
 * @param {number} i
 * @returns {bool}
 */
function commandParameterInputIsVisible(options, i) {
	const commandParams = options.command_parameters
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
 * @returns {CompanionInputFieldTextInput[]}
 */
function generateInputsForCommandParameters() {
	const inputs = []
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
 *
 * @param {import('@companion-module/base').CompanionOptionValues} options
 */
function addCommandParameterDefaults(options) {
	for (let i = 0; i < MAX_PARAMETERS_IN_COMMAND; i++) {
		options[`parameter${i}`] = CommandParameterDefault
	}
}

// The standard reply to an inquiry is one message containing one or more
// parameters, so this must be at least 1.
//
// The standard response to a command is ACK and Completion, so this must be at
// least 2.
//
// Leave it at 2 til someone wants more.
const MAX_MESSAGES_IN_RESPONSE = 2

const PARAMETERS_SPLITTER = /; ?/g
const NIBBLES_SPLITTER = /, ?/g

/**
 * Parse a message parameters string (like "5" or "6,7" or "8; 10,12; 13") into
 * an array of parameters, each of which is an array of half-byte offsets into a
 * VISCA message.
 *
 * @param {number[]} command
 *    The message to which the parameters information is being applied
 * @param {string} parametersString
 *    A parameters string: a semicolon-separated list of comma-separated lists
 *    of nibble offsets, all nibble offsets being unique and referring to
 *    nibbles in `command` that are zero.
 * @returns {number[][]}
 */
function parseParameters(command, parametersString) {
	if (parametersString === '') return []

	const params = parametersString.split(PARAMETERS_SPLITTER)

	// Parse.
	const parameters = params.map((parameterString) => {
		return parameterString.split(NIBBLES_SPLITTER).map((ds) => parseInt(ds, 10))
	})

	// Validate.
	const seen = new Set()
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

function identity(x) {
	return x
}

/**
 * Parse response options info into response/parameters info to pass to
 * `UserDefinedCommand`.
 *
 * @param {CompanionOptionValues} options
 * @returns {{ value: number[], mask: number[], params: Object.<string, { nibbles: number[], paramToChoice: (param: number) => string }> }[]}
 */
function parseResponses(options) {
	/** @type {{ value: number[], mask: number[], params: Object.<string, { nibbles: number[], paramToChoice: (param: number) => string }> }[]} */
	const responses = []

	const responseCount = options.response_count
	for (let i = 0; i < responseCount; i++) {
		const valueBytes = parseMessage(options[`response${i}_bytes`])
		const maskBytes = parseMessage(options[`response${i}_mask`])
		if (valueBytes.length !== maskBytes.length) {
			throw new RangeError(`response #${i + 1} values and mask are different lengths`)
		}

		responses.push({
			value: valueBytes,
			mask: maskBytes,
			params: {},
		})
	}

	return responses
}

const STANDARD_RESPONSE = [
	{ bytes: '90 40 FF', mask: 'FF F0 FF' },
	{ bytes: '90 50 FF', mask: 'FF F0 FF' },
]

function getResponseOptionDefault(i, field) {
	if (i < STANDARD_RESPONSE.length) {
		return STANDARD_RESPONSE[i][field]
	}
	return ''
}

const CommandParametersOptionId = 'command_parameters'
const CommandParametersDefault = ''

const ResponseCountOptionId = 'response_count'
const ResponseCountDefault = STANDARD_RESPONSE.length

function addResponseDefaults(options) {
	for (let i = 0; i < MAX_MESSAGES_IN_RESPONSE; i++) {
		options[`response${i}_bytes`] = getResponseOptionDefault(i, 'bytes')
		options[`response${i}_mask`] = getResponseOptionDefault(i, 'mask')
	}
}

export function isCustomCommandMissingCommandParametersAndResponse(action) {
	return action.actionId === CustomCommandActionId && !(CommandParametersOptionId in action.options)
}

/**
 * At one time, the "Custom command" action took only a single option with id
 * "custom" specifying the bytes to send.
 *
 * Now, the "Custom command" action supports user-defined parameters in the
 * command being sent and an expected series of responses through a bunch of
 * added option ids.
 *
 * Add plausible default values for all those new option ids to old-school
 * `options` that lack them.
 *
 * @param {import('@companion-module/base').CompanionOptionValues} options
 */
export function addCommandParametersAndResponseToCustomCommandOptions(options) {
	options[CommandParametersOptionId] = CommandParametersDefault
	addCommandParameterDefaults(options)
	options[ResponseCountOptionId] = ResponseCountDefault
	addResponseDefaults(options)
}

/**
 * Generate an action definition for the "Custom command" action.
 *
 * @param {PtzOpticsInstance} instance
 * @returns {CompanionActionDefinition}
 */
export function generateCustomCommandAction(instance) {
	const COMMAND_REGEX = '/^81 ?(?:[0-9a-fA-F]{2} ?){3,13}[fF][fF]$/'
	const PARAMETER_LIST_REGEX = '/^(?:[0-9]+(?:, ?[0-9]+)*(?:; ?[0-9]+(?:, ?[0-9]+)*)*|)$/'

	return {
		name: 'Custom command',
		description:
			'Send a command of custom bytes (with embedded parameters filled ' +
			'by user-defined expression) to the camera, and accept a ' +
			'response matching customized syntax.  (Any parameters in the ' +
			'response must be masked out: there is presently no way to ' +
			'access their values.)  Refer to PTZOptics VISCA over IP command ' +
			'documentation for command/response structure.',
		options: [
			{
				type: 'textinput',
				label: 'Bytes of command (set half-bytes in any parameters to zeroes)',
				id: 'custom',
				regex: COMMAND_REGEX,
				width: 6,
			},
			{
				type: 'textinput',
				label: 'Parameter locations in command',
				id: CommandParametersOptionId,
				regex: PARAMETER_LIST_REGEX,
				tooltip:
					'The parameter list must be separated by ' +
					'semicolons.  Each parameter should be a comma-' +
					'separated sequence of half-byte offsets into ' +
					'the command.  Offsets must not be reused.',
				default: CommandParametersDefault,
			},
			...generateInputsForCommandParameters(),
			{
				type: 'number',
				label: 'Number of messages in response',
				id: ResponseCountOptionId,
				default: ResponseCountDefault,
				min: 1,
				max: MAX_MESSAGES_IN_RESPONSE,
			},
			...(() => {
				// The range of byte values allowed by these two regular
				// expressions must be identical.
				// 1 + (1 to 14) + 1
				const RESPONSE_REGEX = '/^90 ?(?:[0-9a-fA-F]{2} ?){1,14}[fF][fF]$/'
				// (2 to 15) + 1
				const RESPONSE_MASK_REGEX = '/(?:[0-9a-fA-F]{2} ?){2,15}[fF][fF]$/'

				const allResponseFields = []
				for (let i = 0; i < MAX_MESSAGES_IN_RESPONSE; i++) {
					const isVisible = (options, i) => i < options.response_count

					const responseFields = [
						{
							type: 'textinput',
							label: `Bytes of expected response #${i + 1} (set half-bytes in any parameters to zeroes)`,
							id: `response${i}_bytes`,
							regex: RESPONSE_REGEX,
							default: getResponseOptionDefault(i, 'bytes'),
							isVisibleData: i,
							isVisible,
						},
						{
							type: 'textinput',
							label: `Mask bytes of expected response #${i + 1}`,
							id: `response${i}_mask`,
							regex: RESPONSE_MASK_REGEX,
							default: getResponseOptionDefault(i, 'mask'),
							isVisibleData: i,
							isVisible,
						},
					]

					allResponseFields.push(...responseFields)
				}

				return allResponseFields
			})(),
		],
		callback: async ({ options }, context) => {
			const commandBytes = parseMessage(options.custom)

			const commandParams = parseParameters(commandBytes, options.command_parameters).reduce((acc, nibbles, i) => {
				acc[`param_${i}`] = {
					nibbles,
					choiceToParam: identity,
				}

				return acc
			}, {})

			/** @type {{ value: number[], mask: number[], params: Object.<string, { nibbles: number[], paramToChoice: (param: number) => string }> }[]} */
			const responseMessages = parseResponses(options).map(({ value, mask }) => {
				return {
					value,
					mask,
					params: {},
				}
			})

			const command = new UserDefinedCommand(commandBytes, commandParams, responseMessages)

			const commandOpts = {}
			for (let i = 0; i < commandParams.length; i++) {
				const val = await context.parseVariablesInString(options[`parameter${i}`])
				commandOpts[`param_${i}`] = Number(val)
			}

			instance.sendCommand(command, commandOpts)
		},
	}
}
