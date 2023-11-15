import { InstanceBase, TCPHelper, Regex, runEntrypoint } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'

class PtzOpticsInstance extends InstanceBase {
	socket = null

	ptSpeed = '0C'
	ptSpeedIndex = 12

	constructor(internal) {
		super(internal)
	}

	sendVISCACommand(str) {
		if (this.socket !== null) {
			var buffer = Buffer.from(str, 'binary')
			this.socket.send(buffer)
		}
	}

	updateActions() {
		this.setActionDefinitions(getActions(this))
	}

	updatePresets() {
		this.setPresetDefinitions(getPresets())
	}

	// Return config fields for web config of the module instance
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module controls PTZ cameras with VISCA over IP protocol',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Camera IP',
				width: 6,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'VISCA TCP port',
				width: 6,
				default: 5678,
				regex: Regex.PORT,
			},
		]
	}

	// When the module gets deleted
	async destroy() {
		if (this.socket !== null) {
			this.socket.destroy()
			this.socket = null
		}

		this.log('destroying module: ', this.id)
	}

	async init(config) {
		this.config = config

		// this is not called by Companion directly, so we need to call this to load the actions into Companion
		this.updateActions()

		// this is not called by Companion directly, so we need to call this to load the presets into Companion
		this.updatePresets()

		// start up the TCP socket and attmept to get connected to the PTZOptics device
		this.initTCP()
	}

	initTCP() {
		if (this.socket !== null) {
			// clean up the socket and keep Companion connection status up to date in the event that the socket ceases to exist
			this.socket.destroy()
			this.socket = null

			this.updateStatus('disconnected')
		}

		if (this.config.host) {
			// create a TCPHelper instance to use as our TCP socket
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.updateStatus('connecting')

			this.socket.on('status_change', (status, message) => {
				this.log('debug', message)
			})

			this.socket.on('error', (err) => {
				// make sure that we log and update Companion connection status for a network failure
				this.log('Network error', err)
				this.log('error', 'Network error: ' + err.message)
				this.updateStatus('connection_failure')
			})

			this.socket.on('connect', () => {
				this.log('debug', 'Connected')
				this.updateStatus('ok')
			})
		}
	}

	configUpdated(config) {
		// handle if the connection needs to be reset (ex. if the user changes the IP address, and we need to re-connect the socket to the new address)
		var resetConnection = false

		if (this.config.host != config.host) {
			resetConnection = true
		}

		this.config = config

		if (resetConnection || this.socket === null) {
			this.initTCP()
		}
	}
}

runEntrypoint(PtzOpticsInstance, [])
