const { InstanceBase, TCPHelper, runEntrypoint } = require('@companion-module/base')
const actions = require('./actions')
const presets = require('./presets')

class PtzOpticsInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	sendVISCACommand(str) {
		if (this.socket !== undefined) {
			var buffer = Buffer.from(str, 'binary')
			this.socket.send(buffer)
		}
	}

	updateActions() {
		this.setActionDefinitions(actions.getActions(this))
	}

	// Return config fields for web config of the module instance
	getConfigFields() {
		return [
			{
				type: 'text',
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
				regex: this.REGEX_IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'VISCA TCP port',
				width: 6,
				default: 5678,
				regex: this.REGEX_PORT,
			},
		]
	}

	// When module gets deleted
	async destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		this.log('destroying module: ', this.id)
	}

	async init(config) {
		this.config = config

		this.ptSpeed = '0C'
		this.ptSpeedIndex = 12

		// this is not called by Companion directly, so we need to call this to load the actions into Companion
		this.updateActions()

		// this is not called by Companion directly, so we need to call this to load the presets into Companion
		this.updatePresets()

		// start up the TCP socket and attmept to get connected to the PTZOptics device
		this.initTCP()
	}

	initTCP() {
		if (this.socket !== undefined) {
			// clean up the socket and keep Companion connection status up to date in the event that the socket ceases to exist
			this.socket.destroy()
			delete this.socket
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
				let cmd = Buffer.from([
					0x55, 0xaa, 0x00, 0x00, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02, 0x00,
					0x57, 0x56,
				])
				this.socket.send(cmd)
				this.log('debug', 'Connected')
				this.updateStatus('ok')
			})
		}
	}

	updatePresets() {
		this.setPresetDefinitions(presets.getPresets())
	}

	configUpdated(config) {
		// handle if the connection needs to be reset (ex. if the user changes the IP address, and we need to re-connect the socket to the new address)
		let resetConnection = false

		if (this.config.host != config.host) {
			resetConnection = true
		}

		this.config = config

		if (resetConnection === true || this.socket === undefined) {
			this.initTCP()
		}
	}
}

runEntrypoint(PtzOpticsInstance, [])
