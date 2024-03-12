import { UserDefinedCommand } from './visca/command.js'

/**
 * Generate an action definition for the "Custom command" action.
 *
 * @param {PtzOpticsInstance} instance
 * @returns {CompanionActionDefinition}
 */
export function generateCustomCommandAction(instance) {
	return {
		name: 'Custom command',
		options: [
			{
				type: 'textinput',
				label: 'Please refer to PTZOptics VISCA over IP command document for valid commands.',
				id: 'custom',
				regex: '/^81 ?([0-9a-fA-F]{2} ?){3,13}[fF][fF]$/',
				width: 6,
			},
		],
		callback: async (event) => {
			if (typeof event.options.custom === 'string' || event.options.custom instanceof String) {
				const hexData = event.options.custom.replace(/\s+/g, '')
				const bytes = []
				for (let i = 0; i < hexData.length; i += 2) {
					bytes.push(parseInt(hexData.substr(i, 2), 16))
				}

				const command = new UserDefinedCommand(bytes)
				instance.sendCommand(command)
			}
		},
	}
}
