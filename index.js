var instance_skel = require('../../instance_skel');
var tcp           = require('../../tcp');
var debug;
var log;

var IRIS = [
	{ id: '11', label: 'F1.8' },
	{ id: '10', label: 'F2.0' },
	{ id: '0F', label: 'F2.4' },
	{ id: '0E', label: 'F2.8' },
	{ id: '0D', label: 'F3.4' },
	{ id: '0C', label: 'F4.0' },
	{ id: '0B', label: 'F4.8' },
	{ id: '0A', label: 'F5.6' },
	{ id: '09', label: 'F6.8' },
	{ id: '08', label: 'F8.0' },
	{ id: '07', label: 'F9.6' },
	{ id: '06', label: 'F11' },
	{ id: '00', label: 'CLOSED' }
];

var SHUTTER = [
	{ id: '11', label: '1/1000000' },
	{ id: '10', label: '1/6000' },
	{ id: '0F', label: '1/4000' },
	{ id: '0E', label: '1/3000' },
	{ id: '0D', label: '1/2000' },
	{ id: '0C', label: '1/1500' },
	{ id: '0B', label: '1/1000' },
	{ id: '0A', label: '1/725' },
	{ id: '09', label: '1/500' },
	{ id: '08', label: '1/350' },
	{ id: '07', label: '1/250' },
	{ id: '06', label: '1/180' },
	{ id: '05', label: '1/125' },
	{ id: '04', label: '1/100' },
	{ id: '03', label: '1/90' },
	{ id: '02', label: '1/60' },
	{ id: '01', label: '1/30' }
];

var PRESET = [];
for (var i = 0; i < 128; ++i) {
	PRESET.push({ id: i.toString(16).padStart(2,'0').toUpperCase(), label: 'Preset ' + i });
}

var SPEED = [
	{ id: '18', label: 'Speed 24 (Fast)' },
	{ id: '17', label: 'Speed 23' },
	{ id: '16', label: 'Speed 22' },
	{ id: '15', label: 'Speed 21' },
	{ id: '14', label: 'Speed 20' },
	{ id: '13', label: 'Speed 19' },
	{ id: '12', label: 'Speed 18' },
	{ id: '11', label: 'Speed 17' },
	{ id: '10', label: 'Speed 16' },
	{ id: '0F', label: 'Speed 15' },
	{ id: '0E', label: 'Speed 14' },
	{ id: '0D', label: 'Speed 13' },
	{ id: '0C', label: 'Speed 12' },
	{ id: '0B', label: 'Speed 11' },
	{ id: '0A', label: 'Speed 10' },
	{ id: '09', label: 'Speed 09' },
	{ id: '08', label: 'Speed 08' },
	{ id: '07', label: 'Speed 07' },
	{ id: '06', label: 'Speed 06' },
	{ id: '05', label: 'Speed 05' },
	{ id: '04', label: 'Speed 04' },
	{ id: '03', label: 'Speed 03' },
	{ id: '02', label: 'Speed 02' },
	{ id: '01', label: 'Speed 01 (Slow)' }
];


function hex2str(hexdata) {
		var result = '';
		for (var i = 0; i < hexdata.length; i += 2) {
				result += String.fromCharCode( parseInt(hexdata.substr(i,2), 16) );
		}

		return result;
};


/*
 * Helper function to convert a binary string to a hex ASCII string
 */
function bin2hex(binStr) {

	let strCmd = Buffer.from( binStr, 'binary' ).toString( 'hex' ).toUpperCase();

	return strCmd;
};


function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	return self;
}

/**
 * Defines the dynamic variables this module will expose. Initialize all variables to a default value.
 */
instance.prototype.defineDynamicVariables = function() {
	let self = this;
	let variables = [];

	variables.push({ name: 'active_preset', label: 'The active preset' });
	variables.push({ name: 'power', label: 'Current power status' });

	self.setVariableDefinitions(variables);

	// Initialize the default values for the variables
	for (let i=0; i<variables.length; i++) {
		self.setVariable(variables[i].name, '');
	}

};

/**
 * Updates the internal state of a variable within this module.
 * 
 * Optionally updates the dynamic variable with its new value.
 */
instance.prototype.setInstanceState = function(variable, value, isVariable) {
	let self = this;

	self.instanceState[variable] = value;

	if (isVariable) {
		self.setVariable(variable, value);
	}

};

/**
 * Defines the feedbacks this module will expose.
 */
instance.prototype.defineFeedbacks = function() {
	let self = this;
	let feedbacks = {};

	feedbacks['active_preset'] = {
		label: 'When preset is active',
		description: "Changes the button's style when this preset is active.",
		options: [
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: self.rgb(51, 102, 0)
			},
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: self.rgb(255, 255, 255)
			},
			{
				type: 'dropdown',
				label: 'Preset',
				id: 'val',
				default: '01',
				choices: PRESET
			},
		],
	};

	feedbacks['power'] = {
		label: 'Camera power status',
		description: "Changes the button's style based on the camera power.",
		options: [
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: self.rgb(51, 102, 0)
			},
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: self.rgb(255, 255, 255)
			},
			{
				type: 'dropdown',
				label: 'Power state',
				id: 'bool',
				default: 'off',
				choices: [
					{ id: 'on', label: 'on' },
					{ id: 'off', label: 'off' }
				]
			},
		],
	};

	self.setFeedbackDefinitions(feedbacks);

};


/*
 * Separate each byte in a hex string by spaces.
 */
instance.prototype.pretifyHexString = function (hexStr) {
	return hexStr.match(/.{1,2}/g).join(' ');
};


/*
 * TCP on-data callback for updating feedbacks and dynamic variables.
 */
instance.prototype.handleTcpData = function (data) {

	// For the rest of this function we assume we have a Buffer object.
	if ( ! (data instanceof Buffer) ) {
		console.log("Data from PTZoptics VISCA: ", data);

		return;
	}

	let resp = data.toString('hex').toUpperCase();

	console.log("Data from PTZoptics VISCA: ", this.pretifyHexString( resp ) );

	const cmdACK			= /^904[0-9]FF$/i;
	const cmdComplete		= /^905[0-9]FF$/i;
	const cmdSyntaxError	= /^906002FF$/i;
	const cmdBufferFull		= /^906003FF$/i;
	const cmdCanceled		= /^906[0-9]04FF$/i;
	const cmdNoSocket		= /^906[0-9]05FF$/i;
	const cmdNotExecutable	= /^906[0-9]41FF$/i;
	const cmdInquiry		= /^9050[0-9A-F]+FF$/i;
	
	const presetResetCmds = [
		'left',
		'right',
		'up',
		'down',
		'upLeft',
		'upRight',
		'downLeft',
		'downRight',
		'zoomI',
		'zoomO',
	];

	// Sometimes multiple camera responses come in one tcp response, so we need to handle that.
	responses = resp.split('FF').filter(item => item != '').map(resp => resp + 'FF');

	for (let respIndex = 0; respIndex < responses.length; ++respIndex) {

		if ( responses[respIndex].match(cmdACK) ) {
			// This ACK is in response to some command, so let's pull out the oldest command
			this.currentCommand = this.commandQueue.shift();

		} else if ( this.currentCommand && responses[respIndex].match(cmdComplete) ) {
			// We have a command and we received response back that it was complete. Let's
			// attempt to update any variables or feedbacks.
			if ( 'recallPset' === this.currentCommand.name ) {
				// Save the variable as base-10 number for ease of readability
				this.setInstanceState('active_preset', parseInt( this.currentCommand.options.val, 16 ), true);
				this.checkFeedbacks('active_preset');
			}

			if ( presetResetCmds.find( item => item === this.currentCommand.name ) ) {
				this.setInstanceState('active_preset', '', true);
				this.checkFeedbacks('active_preset');
			}

			if ( 'power' === this.currentCommand.name ) {
				this.updatePowerFeedbacks( this.currentCommand );
			}

			// Now that we've handled this command, let's clear it
			this.currentCommand = null;

		} else if ( responses[respIndex].match( cmdInquiry ) ) {

			// Inquiry commands do not have the ACK followed by 'Complete' response structure.
			// Instead, they just send back the inquiry response without either the ACK
			// or 'Complete' response. In such a case we need to shift off our last command
			// as it would not already been done so in an ACK response.

			this.currentCommand = this.commandQueue.shift();

			// TODO: Update any specific inquiry feedbacks or variables

			this.log('info', `Command Name: ${ this.currentCommand.name }; Raw command: ${ this.pretifyHexString( this.currentCommand.cmd ) }; Raw response: ${ this.pretifyHexString( responses[respIndex] ) }`);

			// Now that we've handled this command, let's clear it
			this.currentCommand = null;

		} else if ( responses[respIndex].match( cmdSyntaxError ) ) {

			let cmd = this.commandQueue.shift();  // Remove bad command from queue

			this.log('error', `Camera command contains a syntax error. (Command Name: ${ cmd.name }; Raw command: ${  this.pretifyHexString( cmd.cmd ) })`);

		} else if ( responses[respIndex].match( cmdBufferFull ) ) {

			let cmd = this.commandQueue.shift();  // Remove lost command from queue

			this.log('error', `Camera ignored the command because its buffer was full. (Command Name: ${ cmd.name }; Raw command: ${ this.pretifyHexString( cmd.cmd ) })`);

		} else if ( responses[respIndex].match( cmdCanceled ) ) {
			// Somehow the last command was canceled. We assume we've received
			// an ACK for it already, so it should not be shifted off the queue.

			let msg = 'Camera command was canceled.';
			if ( this.currentCommand ) {
				msg = msg + ` (Command Name: ${ this.currentCommand.name }; Raw command: ${ this.pretifyHexString( this.currentCommand.cmd ) })`;
			}

			this.log('info', msg);

		} else if ( responses[respIndex].match( cmdNoSocket ) ) {

			let cmd = this.commandQueue.shift();  // Remove lost command from queue

			this.log('error', `Camera command was not completed as there was no available socket. (Command Name: ${ cmd.name }; Raw command: ${ this.pretifyHexString( cmd.cmd ) })`);

		} else if ( responses[respIndex].match( cmdNotExecutable ) ) {

			let cmd = this.commandQueue.shift();  // Remove command from queue

			if ( 'power' === cmd.name && cmd.options.bool === 'on' ) {
				// If we sent a power on command and it's not executable we assume the camera is already on.
				// This is necessary as there's no power inquiry command.
				this.updatePowerFeedbacks( cmd );
			} else {
				this.log('error', `Camera command could not be executed. (Command Name: ${ cmd.name }; Raw command: ${ this.pretifyHexString( cmd.cmd ) })`);
			}

		} else {

			// We shouldn't get here, but log if we do. We assume there's no command waiting
			// on the queue that elicited this response.
			this.log('warning', 'An unknown response came back from the camera.');

		}

	}

};


/*
 * Update the 'power' global variable and feedbacks based on the given
 * command object.
 */
instance.prototype.updatePowerFeedbacks = function(queueCmd) {
	this.setInstanceState('power', queueCmd.options.bool, true);
	this.checkFeedbacks('power');

	// Clear active preset value when the camera is shut off.
	if ( 'off' === queueCmd.options.bool ) {
		// TODO: Encapsulate the variable and feedback reset logic into its own function.
		this.setInstanceState('active_preset', '', true);
		this.checkFeedbacks('active_preset');
	}
};


instance.prototype.init_tcp = function() {
	var self = this;

	if (self.tcp !== undefined) {
		self.tcp.destroy();
		delete self.tcp;
	}

	if (self.config.host !== undefined) {
		self.tcp = new tcp(self.config.host, self.config.port);

		self.tcp.on('status_change', function (status, message) {
			self.status(status, message);

			// pulled from the tcp library (tcp.js)
			const TCP_STATUS_UNKNOWN = null;
			const TCP_STATUS_OK = 0;
			const TCP_STATUS_WARNING = 1;
			const TCP_STATUS_ERROR = 2;

			if ( status === TCP_STATUS_UNKNOWN || status === TCP_STATUS_ERROR ) {
				// Clear the command queue if we had a TCP error. Otherwise our queue will get out of sync.
				self.commandQueue = [];
			}
		});

		self.tcp.on('error', function (e) {
			debug('tcp error:', e.message);
		});

		self.tcp.on('data', self.handleTcpData.bind(self));

		debug(self.tcp.host + ':' + self.config.port);
	}
};

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;
	self.ptSpeed = '0C';
	self.ptSpeedIndex = 12;
	self.commandQueue = [];
	self.instanceState = {};
	self.currentCommand = null;
	self.queuePrune = setInterval( self.pruneCmdQueue.bind(self), 1000 );

	self.status(self.STATUS_UNKNOWN);

	self.defineDynamicVariables();
	self.defineFeedbacks();
	self.init_tcp();
	self.actions(); // export actions
	self.init_presets();
};


/*
 * Remove any stale commands from the queue in the chance that the queue
 * gets out of sync. 
 */
instance.prototype.pruneCmdQueue = function() {
	let shouldStop = false;
	while ( shouldStop === false && this.commandQueue.length > 0 ) {
		// Remove commands that are older than 1.5 seconds. We should have received
		// a response from the camera well within this window of time.

		if ( ( Date.now() - this.commandQueue[0].time ) > 1500 ) {
			let cmd = this.commandQueue.shift();
			this.log('warning', `Command queue was out of sync. Cleaning up old command. (Command Name: ${ cmd.name }; Raw command: ${ this.pretifyHexString( cmd.cmd ) })`)
		} else {
			shouldStop = true;
		}
	}
}

instance.prototype.updateConfig = function(config) {
	var self = this;
	self.config = config;

	if (self.tcp !== undefined) {
		self.tcp.destroy();
		delete self.tcp;
	}

	self.status(self.STATUS_UNKNOWN);

	if (self.config.host !== undefined) {
		self.init_tcp();
	}
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module controls PTZ cameras with VISCA over IP protocol'
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Camera IP',
			width: 6,
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'VISCA TCP port',
			width: 6,
			default: 5678,
			regex: self.REGEX_PORT
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.tcp !== undefined) {
		self.tcp.destroy();
	}

	if (self.queuePrune) {
		clearInterval( self.queuePrune );
	}

	debug("destroy", self.id);
};

instance.prototype.init_presets = function () {
	var self = this;
	var presets = [
		{
			category: 'Pan/Tilt',
			label: 'UP',
			bank: {
				style: 'png',
				text: '',
				png64: image_up,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,255)
			},
			actions: [
				{
					action: 'up',
				}
			],
			release_actions: [
				{
					action: 'stop',
				}
			]
		},
		{
			category: 'Pan/Tilt',
			label: 'DOWN',
			bank: {
				style: 'png',
				text: '',
				png64: image_down,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [
				{
					action: 'down',
				}
			],
			release_actions: [
				{
					action: 'stop',
				}
			]
		},
		{
			category: 'Pan/Tilt',
			label: 'LEFT',
			bank: {
				style: 'png',
				text: '',
				png64: image_left,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [
				{
					action: 'left',
				}
			],
			release_actions: [
				{
					action: 'stop',
				}
			]
		},
		{
			category: 'Pan/Tilt',
			label: 'RIGHT',
			bank: {
				style: 'png',
				text: '',
				png64: image_right,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [
				{
					action: 'right',
				}
			],
			release_actions: [
				{
					action: 'stop',
				}
			]
		},
		{
			category: 'Pan/Tilt',
			label: 'UP RIGHT',
			bank: {
				style: 'png',
				text: '',
				png64: image_up_right,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [
				{
					action: 'upRight',
				}
			],
			release_actions: [
				{
					action: 'stop',
				}
			]
		},
		{
			category: 'Pan/Tilt',
			label: 'UP LEFT',
			bank: {
				style: 'png',
				text: '',
				png64: image_up_left,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [
				{
					action: 'upLeft',
				}
			],
			release_actions: [
				{
					action: 'stop',
				}
			]
		},
		{
			category: 'Pan/Tilt',
			label: 'DOWN LEFT',
			bank: {
				style: 'png',
				text: '',
				png64: image_down_left,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [
				{
					action: 'downLeft',
				}
			],
			release_actions: [
				{
					action: 'stop',
				}
			]
		},
		{
			category: 'Pan/Tilt',
			label: 'DOWN RIGHT',
			bank: {
				style: 'png',
				text: '',
				png64: image_down_right,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [
				{
					action: 'downRight',
				}
			],
			release_actions: [
				{
					action: 'stop',
				}
			]
		},
		{
			category: 'Pan/Tilt',
			label: 'Home',
			bank: {
				style: 'text',
				text: 'HOME',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [
				{
					action: 'home',
				}
			]
		},
		{
			category: 'Pan/Tilt',
			label: 'Speed Up',
			bank: {
				style: 'text',
				text: 'SPEED\\nUP',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [
				{
					action: 'ptSpeedU',
				}
			]
		},
		{
			category: 'Pan/Tilt',
			label: 'Speed Down',
			bank: {
				style: 'text',
				text: 'SPEED\\nDOWN',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [
				{
					action: 'ptSpeedD',
				}
			]
		},
		{
			category: 'Lens',
			label: 'Zoom In',
			bank: {
				style: 'text',
				text: 'ZOOM\\nIN',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [
				{
					action: 'zoomI',
				}
			],
			release_actions: [
				{
					action: 'zoomS',
				}
			]
		},
		{
			category: 'Lens',
			label: 'Zoom Out',
			bank: {
				style: 'text',
				text: 'ZOOM\\nOUT',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [
				{
					action: 'zoomO',
				}
			],
			release_actions: [
				{
					action: 'zoomS',
				}
			]
		},
		{
			category: 'Lens',
			label: 'Focus Near',
			bank: {
				style: 'text',
				text: 'FOCUS\\nNEAR',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0),
			},
			actions: [
				{
					action: 'focusN',
				}
			],
			release_actions: [
				{
					action: 'focusS',
				}
			]
		},
		{
			category: 'Lens',
			label: 'Focus Far',
			bank: {
				style: 'text',
				text: 'FOCUS\\nFAR',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0),
			},
			actions: [
				{
					action: 'focusF',
				}
			],
			release_actions: [
				{
					action: 'focusS',
				}
			]
		},
		{
			category: 'Lens',
			label: 'Auto Focus',
			bank: {
				style: 'text',
				text: 'AUTO\\nFOCUS',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0),
				latch: true
			},
			actions: [
				{
					action: 'focusM',
					options: {
						bol: 0,
					}
				}
			],
			release_actions: [
				{
					action: 'focusM',
					options: {
						bol: 1,
					}
				}
			]
		},
		{
			category: 'Lens',
			label: 'Focus Lock',
			bank: {
				style: 'text',
				text: 'FOCUS\\nLOCK',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0),
			},
			actions: [
				{
					action: 'focusL',
				}
			]
		},
		{
			category: 'Lens',
			label: 'Focus Unlock',
			bank: {
				style: 'text',
				text: 'FOCUS\\nUNLOCK',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0),
			},
			actions: [
				{
					action: 'focusU',
				}
			]
		},
		{
			category: 'Exposure',
			label: 'Exposure Mode',
			bank: {
				style: 'text',
				text: 'EXP\\nMODE',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0),
				latch: true
			},
			actions: [
				{
					action: 'expM',
					options: {
						bol: 0,
					}
				}
			],
			release_actions: [
				{
					action: 'expM',
					options: {
						bol: 1,
					}
				}
			]
		},
		{
			category: 'Exposure',
			label: 'Iris Up',
			bank: {
				style: 'text',
				text: 'IRIS\\nUP',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0),
			},
			actions: [
				{
					action: 'irisU',
				}
			]
		},
		{
			category: 'Exposure',
			label: 'Iris Down',
			bank: {
				style: 'text',
				text: 'IRIS\\nDOWN',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0),
			},
			actions: [
				{
					action: 'irisD',
				}
			]
		},
		{
			category: 'Exposure',
			label: 'Shutter Up',
			bank: {
				style: 'text',
				text: 'Shut\\nUP',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0),
			},
			actions: [
				{
					action: 'shutU',
				}
			]
		},
		{
			category: 'Exposure',
			label: 'Shutter Down',
			bank: {
				style: 'text',
				text: 'Shut\\nDOWN',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0),
			},
			actions: [
				{
					action: 'shutD',
				}
			]
		}
	];

var save;
for (save = 0; save < 63; save++) {
	presets.push({
		category: 'Save Preset',
		label: 'Save Preset '+ parseInt(save+1) ,
		bank: {
			style: 'text',
			text: 'SAVE\\nPSET\\n' + parseInt(save+1) ,
			size: '14',
			color: '16777215',
			bgcolor: self.rgb(0,0,0),
		},
		actions: [
			{
				action: 'savePset',
				options: {
				val: ('0' + save.toString(16).toUpperCase()).substr(-2,2),
				}
			}
		]
	});
}

var recall;
for (recall = 0; recall < 63; recall++) {
	presets.push({
		category: 'Recall Preset',
		label: 'Recall Preset '+ parseInt(recall+1) ,
		bank: {
			style: 'text',
			text: 'Recall\\nPSET\\n' + parseInt(recall+1) ,
			size: '14',
			color: '16777215',
			bgcolor: self.rgb(0,0,0),
		},
		actions: [
			{
				action: 'recallPset',
				options: {
				val: ('0' + recall.toString(16).toUpperCase()).substr(-2,2),
				}
			}
		]
	});
}

	self.setPresetDefinitions(presets);
};


/**
 * Returns a button's new style if feedback is appropriate.
 */
instance.prototype.feedback = function(feedback) {

	if (this.instanceState === undefined) {
		return;
	}

	if (feedback.type === 'active_preset')  {
		// Active preset changed. Let's update our feedbacks.

		// Since we're storing the preset as a base10 number but everything else
		// is in base16 string format, we need to convert the base16 number to
		// base10 so we can accurately compare them.
		let pset = parseInt( feedback.options.val, 16 );

		if (pset === this.instanceState['active_preset']) {

			return {
				color   : feedback.options.fg,
				bgcolor : feedback.options.bg,
			};

		}
	} else if (feedback.type === 'power')  {
		// The power status changed. Let's update our feedbacks.

		if (feedback.options.bool == this.instanceState['power']) {

			return {
				color   : feedback.options.fg,
				bgcolor : feedback.options.bg,
			};

		}
	}

	return {};

}


instance.prototype.actions = function(system) {
	var self = this;

	self.system.emit('instance_actions', self.id, {
		'left':           { label: 'Pan Left' },
		'right':          { label: 'Pan Right' },
		'up':             { label: 'Tilt Up' },
		'down':           { label: 'Tilt Down' },
		'upLeft':         { label: 'Up Left' },
		'upRight':        { label: 'Up Right' },
		'downLeft':       { label: 'Down Left' },
		'downRight':      { label: 'Down Right' },
		'stop':           { label: 'P/T Stop' },
		'home':           { label: 'P/T Home' },
		'ptSpeedS':       {
			label: 'P/T Speed',
			options: [
				{
					type: 'dropdown',
					label: 'speed setting',
					id: 'speed',
					choices: SPEED
				}
			]
		},
		'ptSpeedU':       { label: 'P/T Speed Up'},
		'ptSpeedD':       { label: 'P/T Speed Down'},
		'ptSlow':         {
			label: 'P/T Slow Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Slow Mode On/Off',
					id: 'bol',
					choices: [ { id: '1', label: 'Off' }, { id: '0', label: 'On' } ]
				}
			]
		 },
		'zoomI':          { label: 'Zoom In' },
		'zoomO':          { label: 'Zoom Out' },
		'zoomS':          { label: 'Zoom Stop' },
		'focusN':         { label: 'Focus Near' },
		'focusF':         { label: 'Focus Far' },
		'focusS':         { label: 'Focus Stop' },
		'focusM':         {
			label: 'Focus Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Auto / Manual Focus',
					id: 'bol',
					choices: [ { id: '0', label: 'Auto Focus' }, { id: '1', label: 'Manual Focus' } ]
				}
			]
		},
		'focusL':         { label: 'Focus Lock' },
		'focusU':         { label: 'Focus Unlock' },
		'expM':           {
			label: 'Exposure Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Mode setting',
					id: 'val',
					choices: [
						{ id: '0', label: 'Full auto' },
						{ id: '1', label: 'Manual' },
						{ id: '2', label: 'Shutter Pri' },
						{ id: '3', label: 'Iris Pri' },
						{ id: '4', label: 'Bright mode (manual)' }
					]
				}
			]
		},
		'irisU':          { label: 'Iris Up' },
		'irisD':          { label: 'Iris Down' },
		'irisS':          {
			label: 'Set Iris',
			options: [
				{
					type: 'dropdown',
					label: 'Iris setting',
					id: 'val',
					choices: IRIS
				}
			]
		},
		'shutU':          { label: 'Shutter Up' },
		'shutD':          { label: 'Shutter Down' },
		'shutS':          {
			label: 'Set Shutter',
			options: [
				{
					type: 'dropdown',
					label: 'Shutter setting',
					id: 'val',
					choices: SHUTTER
				}
			]
		},
		'savePset':       {
			label: 'Save Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: 'val',
					choices: PRESET
				}
			]
		},
		'recallPset':     {
			label: 'Recall Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: 'val',
					choices: PRESET
				}
			]
		},
		'speedPset':      {
			label: 'Preset Drive Speed',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Nr.',
					id: 'val',
					choices: PRESET
				},
				{
					type: 'dropdown',
					label: 'speed setting',
					id: 'speed',
					choices: SPEED
				}
			]
		},
		'power': {
			label: 'power camera',
			options: [
				{
					type: 'dropdown',
					label: 'power on/off',
					id: 'bool',
					choices: [{ id: 'off', label:'off'},{ id: 'on', label:'on'}]
				}
			]
		},
		'custom':           {
			label: 'Custom command',
			options: [
				{
					type: 'textinput',
					label: 'Please refer to PTZOptics VISCA over IP command document for valid commands.',
					id: 'custom',
					regex: '/^81 ?([0-9a-fA-F]{2} ?){3,13}[fF][fF]$/',
					width: 6
				}
			]
		}
	});
}

instance.prototype.sendVISCACommand = function(str) {
	var self = this;
	let ret = false;

	if (self.tcp !== undefined) {
		var buf = Buffer.from(str, 'binary');
		if ( self.tcp.send(buf) ) {
			ret = true;
		} else {
			// For some reason our command wasn't sent, which means we won't get a
			// response. We depend on responses for keeping our queue in sync with
			// the actual state. So, let's pull our command off the queue to keep
			// it in sync.
			this.commandQueue.shift();
		}
	}

	return ret;
};

/*
 * Create a properly hydrated object to push onto the command queue.
 */
instance.prototype.pushCmdQueue = function (name, cmd, opts) {
	let obj = {
		name:		name,
		cmd:		bin2hex( cmd ),
		options:	opts,
		time:		Date.now(),
	}

	this.commandQueue.push( obj );
}

instance.prototype.action = function(action) {
	var self = this;
	var opt = action.options;
	var cmd = ''

	var panspeed = String.fromCharCode(parseInt(self.ptSpeed, 16) & 0xFF);
	var tiltspeed = String.fromCharCode(Math.min(parseInt(self.ptSpeed, 16), 0x14) & 0xFF);

	switch (action.action) {

		case 'left':
			cmd = '\x81\x01\x06\x01' + panspeed + tiltspeed + '\x01\x03\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'right':
			cmd = '\x81\x01\x06\x01' + panspeed + tiltspeed + '\x02\x03\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'up':
			cmd = '\x81\x01\x06\x01' + panspeed + tiltspeed + '\x03\x01\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'down':
			cmd = '\x81\x01\x06\x01' + panspeed + tiltspeed + '\x03\x02\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'upLeft':
			cmd = '\x81\x01\x06\x01' + panspeed + tiltspeed + '\x01\x01\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'upRight':
			cmd = '\x81\x01\x06\x01' + panspeed + tiltspeed + '\x02\x01\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'downLeft':
			cmd = '\x81\x01\x06\x01' + panspeed + tiltspeed + '\x01\x02\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'downRight':
			cmd = '\x81\x01\x06\x01' + panspeed + tiltspeed + '\x02\x02\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'stop':
			cmd = '\x81\x01\x06\x01' + panspeed + tiltspeed + '\x03\x03\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'home':
			cmd = '\x81\x01\x06\x04\xFF';
			self.pushCmdQueue( action.action, cmd, { val: 0 } );
			self.sendVISCACommand(cmd);
			break;

		case 'ptSpeedS':
			self.ptSpeed = opt.speed;

			var idx = -1;
			for (var i = 0; i < SPEED.length; ++i) {
				if (SPEED[i].id == self.ptSpeed) {
					idx = i;
					break;
				}
			}
			if (idx > -1) {
				self.ptSpeedIndex = idx;
			}
			debug(self.ptSpeed + ' == ' + self.ptSpeedIndex)
			break;

		case 'ptSpeedD':
			if (self.ptSpeedIndex == 23) {
				self.ptSpeedIndex = 23;
			}
			else if (self.ptSpeedIndex < 23) {
				self.ptSpeedIndex ++;
			}
			self.ptSpeed = SPEED[self.ptSpeedIndex].id
			break;

		case 'ptSpeedU':
			if (self.ptSpeedIndex == 0) {
				self.ptSpeedIndex = 0;
			}
			else if (self.ptSpeedIndex > 0) {
				self.ptSpeedIndex--;
			}
			self.ptSpeed = SPEED[self.ptSpeedIndex].id
			break;

		case 'zoomI':
			cmd = '\x81\x01\x04\x07\x02\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'zoomO':
			cmd = '\x81\x01\x04\x07\x03\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'zoomS':
			cmd = '\x81\x01\x04\x07\x00\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'focusN':
			cmd = '\x81\x01\x04\x08\x03\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'focusF':
			cmd = '\x81\x01\x04\x08\x02\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'focusS':
			cmd = '\x81\x01\x04\x08\x00\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'focusM':
			if (opt.bol == 0){
				cmd = '\x81\x01\x04\x38\x02\xFF';
			}
			if (opt.bol == 1){
				cmd = '\x81\x01\x04\x38\x03\xFF';
			}
			self.pushCmdQueue( action.action, cmd, { bol: opt.bol } );
			self.sendVISCACommand(cmd);
			break;

		case 'focusL':
			cmd = '\x81\x0A\x04\x68\x02\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'focusU':
			cmd = '\x81\x0A\x04\x68\x03\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'expM':
			if (opt.val == 0){
				cmd = '\x81\x01\x04\x39\x00\xFF';
			}
			if (opt.val == 1){
				cmd = '\x81\x01\x04\x39\x03\xFF';
			}
			if (opt.val == 2){
				cmd = '\x81\x01\x04\x39\x0A\xFF';
			}
			if (opt.val == 3){
				cmd = '\x81\x01\x04\x39\x0B\xFF';
			}
			if (opt.val == 4){
				cmd = '\x81\x01\x04\x39\x0D\xFF';
			}
			self.pushCmdQueue( action.action, cmd, { val: opt.val } );
			self.sendVISCACommand(cmd);
			break;

		case 'irisU':
			cmd = '\x81\x01\x04\x0B\x02\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'irisD':
			cmd = '\x81\x01\x04\x0B\x03\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'irisS':
			var cmd = Buffer.from('\x81\x01\x04\x4B\x00\x00\x00\x00\xFF', 'binary');
			cmd.writeUInt8((parseInt(opt.val,16) & 0xF0) >> 4, 6);
			cmd.writeUInt8(parseInt(opt.val,16) & 0x0F, 7);
			self.pushCmdQueue( action.action, cmd, { val: opt.val } );
			self.sendVISCACommand(cmd);
			debug('cmd=',cmd);
			break;

		case 'shutU':
			cmd = '\x81\x01\x04\x0A\x02\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'shutD':
			cmd = '\x81\x01\x04\x0A\x03\xFF';
			self.pushCmdQueue( action.action, cmd );
			self.sendVISCACommand(cmd);
			break;

		case 'shutS':
			var cmd = Buffer.from('\x81\x01\x04\x4A\x00\x00\x00\x00\xFF', 'binary');
			cmd.writeUInt8((parseInt(opt.val,16) & 0xF0) >> 4, 6);
			cmd.writeUInt8(parseInt(opt.val,16) & 0x0F, 7);
			self.pushCmdQueue( action.action, cmd, { val: opt.val } );
			self.sendVISCACommand(cmd);
			debug('cmd=',cmd);
			break;

		case 'savePset':
			cmd ='\x81\x01\x04\x3F\x01' + String.fromCharCode(parseInt(opt.val,16) & 0xFF) + '\xFF';
			self.pushCmdQueue( action.action, cmd, { val: opt.val } );
			self.sendVISCACommand(cmd);
			break;

		case 'recallPset':
			cmd ='\x81\x01\x04\x3F\x02' + String.fromCharCode(parseInt(opt.val,16) & 0xFF) + '\xFF';
			self.pushCmdQueue( action.action, cmd, { val: opt.val } );
			self.sendVISCACommand(cmd);
			break;

		case 'speedPset':
			cmd ='\x81\x01\x7E\x01\x0B' + String.fromCharCode(parseInt(opt.val,16) & 0xFF) + String.fromCharCode(parseInt(opt.speed,16) & 0xFF) + '\xFF';
			self.pushCmdQueue( action.action, cmd, { val: opt.val } );
			self.sendVISCACommand(cmd);
			break;
		
		case 'power':
			if(opt.bool == 'off') {
				cmd = '\x81\x01\x04\x00\x03\xFF';
			} else {
				cmd = '\x81\x01\x04\x00\x02\xFF';
			}
			self.pushCmdQueue( action.action, cmd, { bool: opt.bool } );
			self.sendVISCACommand(cmd);
			break;

		case 'custom':
			var hexData = opt.custom.replace(/\s+/g, '');
			var tempBuffer = Buffer.from(hexData, 'hex');
			cmd = tempBuffer.toString('binary');

			if ((tempBuffer[0] & 0xF0) === 0x80) {
				self.pushCmdQueue( action.action, cmd, { custom: hexData } );
				self.sendVISCACommand(cmd);
			} else {
				self.log('error', 'Error, command "' + opt.custom + '" does not start with 8');
			}
			break;

	}
};

instance_skel.extendedBy(instance);

 // Variables for Base64 image data do not edit
var image_up = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6AQMAAAApyY3OAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+LUNEtwAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAAD///+l2Z/dAAAAAXRSTlMAQObYZgAAAIFJREFUKM+90EEKgzAQRmFDFy49ghcp5FquVPBighcRegHBjWDJ68D8U6F7m00+EnhkUlW3ru6rdyCV0INQzSg1zFLLKmU2aeCQQMEEJXIQORRsTLNyKJhNm3IoaPBg4mQorp2Mh1+00kKN307o/bZrpt5O/FlPU/c75X91/fPd6wPRD1eHyHEL4wAAAABJRU5ErkJggg==';

var image_down = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6AQMAAAApyY3OAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+LUNEtwAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAAD///+l2Z/dAAAAAXRSTlMAQObYZgAAAIlJREFUKM/F0DEOwyAMBVAjDxk5Qo7CtdiClIv1KJF6gUpZIhXxY2zTDJ2benoS8LFN9MsKbYjxF2XRS1UZ4bCeGFztFmNqphURpidm146kpwFvLDYJpPQtLSLNoySyP2bRpoqih2oSFW8K3lYAxmJGXA88XMnjeuDmih7XA8vXvNeeqX6U6aY6AacbWAQNWOPUAAAAAElFTkSuQmCC';

var image_left = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6AQMAAAApyY3OAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+LUNEtwAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAAD///+l2Z/dAAAAAXRSTlMAQObYZgAAAHpJREFUKM+1kTEOgCAQBM9Q2JjwA/mJPA2fxlN4giWF8TRBBhMpbKSaZie3i8gPb4Y8FNZKGm8YIAONkNWacIruQLejy+gyug1dQhfRqZa0v6gYA6QfqSWapZnto1B6XdUuFaVHoJunr2MD21nIdJYUEhLYfoGmP777BKKIXC0eYSD5AAAAAElFTkSuQmCC';

var image_right = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6AQMAAAApyY3OAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+LUNEtwAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAAABlBMVEUAAAD///+l2Z/dAAAAAXRSTlMAQObYZgAAAHhJREFUKM+10LERgCAMQFE4CktHcBRWcRMYzVEcwdKCI+od+fGksVCq3/AuiXOfvZnaNXzRClVrEKtMLdSqP2RTRQAFMAFGwAlw7MAk0sAzGnhVoerLKg/F5Pv4NoFNZZNGpk9sxJYeLsDdL5T7S8IFOM/R3OZ+fQeQZV9pMy+bVgAAAABJRU5ErkJggg==';

var image_up_right = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAMAAAAk2e+/AAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+LUNEtwAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAABhlBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+X02G5AAAAgXRSTlMAAte32QZhZx7d+TywDTf8/d5VstYPOxULNvKmSY8TFBrxyeGCluJeELQ5uw7ULND4BedlKuv2P/vDA8UgCk30WO41s8+5X8dABAz6QhHVaR156JpPnihSfTJDNOMBm4bzSICqr23NsRjcGRbtjTCS2lzsOmyu9+WLKb2fTL8+RPDhqO4yAAABfElEQVRYw+3WZW/CUBQG4AO0FBsOwwcMm7sLc3d3d3e388/HGGs7lpD0tsm+9P3S5CT3SdPec+8BkCNHzv9FAVAAEABYdQDkA7jo9GNUIDMBzstb5vr0/Gx8Z35zOjI36R2xbu+619eWa2xCoK0FClF5h1cWxDHEwilEOyLlQc8hokoAlMRcESBh7siQlJBWKkijNaHuPrWBED9iYiDQ7Pv1D4Z4/DXyFo2JgeAghQEkEgAvT6IgNo/PIUmgd62oj80mqEIpINoXRkmg2j2UBDIWVXKLTSXEUIOF/xbV5aRQsJvvUOoqMqjZZ+c7FcX8ThYCtTbxHV0fkEGDA73D3Dpzi/6rWEYAdSn579PZ/t3IBJChkef0dLRlHXdkJ6TSmSnmiYPq1LQIiGHX9BvZYinJ7/+R6q1czUG0j9KSOTxDc6UhshZhMIQrS78mncwZtzErrNcYL6V2Zd0tJ6i7QFtAYPcvHv25W6J+/Y3BrRA/x6WGuGN5mpUjhyyfsGtrpKE95HoAAAAASUVORK5CYII=';

var image_down_right = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAMAAAAk2e+/AAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+LUNEtwAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAABXFBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9jYfXuAAAAc3RSTlMAQ98Ox1j9gAtRNTqBPfgu9p/MTQ+G1Qfx7Y0VBYyJgjkGd3ysU+Zz1IQvMM20PgwBp8Mi4TSUiDvlPxylsaF2WfcjJh0S+wLzQLmY4l/ovX3ra1rPLAOSKa4RUEvgcZwbFHqPzodGbX7qPMvCtsEq1laguT+HEwAAAVlJREFUWMPt1sduwkAQgOGxDfFCIITe0nvvvZHee++992TeX4pJQIC9hPWaQ6T41x6skfY7WGPJAGZm/6qgZjIH4AMgOp2Lq32batTkdW/trPt9+qC70DVmSKS2BXF7A1fX9DDnN2FUSpe8y5hID3SZuJMmrcwmoSFm5vD0BDWSNTnCUmZoD1PZtJCDGfIgRUpBMjPkR4rEAwUtFIkHAkKRuCCaxAdRJE5IK/FCGumWF1JLEW5ILfFD2ST9UBaJA6JLPBCQ57xAJcp5NQbtSgBReJSsH8QI5No8ODo+u397ecL3T35IGhcRA4jig8E9qmjAX2OGnAV5ggrxr0ELOaByVmg6B1TGvEYyTvxcKUaMv/ii7xN/VAZYY2dfSHkkPOYY7Kpf7OmLzLfGPIFGd6izWrRUjdYt9Xfo+ULsLpgRKqGtGyadAEIUmnuhXSAwMAXD5j+omZlZRl+X30CWTm2dHwAAAABJRU5ErkJggg==';

var image_up_left = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAMAAAAk2e+/AAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+LUNEtwAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAABLFBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9PVkEkAAAAY3RSTlMAAQ/6Uc0OEAvHTzL7TcudsMHvdwnfUwMcG8UGiIfTrIkg9QI+/ZTDe460km73LNovCo1vQUuR4Lwk45/OK+3UERTkekziZlSK8QQnoOsFaaXmLqOylvPZLYDRZTUWUpiTDfAuEmiSAAABUklEQVRYw+3WZ2+DMBAG4EtTygrQ7NHsJt1777333vv+/38o6gIMSo0dqf3AK1lIZ/mRjPEJgCBBgvxtQr8WqDKbCiWUG1AnYXU7C7UJqKQSR5oKQwqIPphsYW24nEPjJCYXilf9F+G+qeTmThTP5w8X8gK9NLqOGMGPhD8fdXtBkGihlmlsmF5aqK2xg9FmQe3/DupuEhTpoT41z/V1HVHfxWRRo/6ORBfyjILx9mRo+2MDlS3ggF5q4uP9qzmVNjfOA+EDdDLcWA8IW6FJEJPkCbFI3hCDZEFVPsmC7mQuyYJ0iUuyIAG4JDvEJTkgHskJcUgExC6RECmxQ4REDa24ILsU6wL/rfYHskmX9C87Pfi9aA5cUmnRx/kffDmncSCkat7X342KSzOIuesNR1WSl7GU8Xfbbs9Gyoo0TvRp6Tie8d2TOsyx51UMEiQIS94B13oTqqYgGGoAAAAASUVORK5CYII=';

var image_down_left = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAMAAAAk2e+/AAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+LUNEtwAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAABg1BMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8aT76cAAAAgHRSTlMAafwJfflezc+3WA7Z5Rk6PAvpBNE73kJT89QxZ48czNIv9A1DnI3qKQUaymjT4a7HdVuGf85LR20CVHr+tLBlA0GvYSTYZEnbAcazNPX4yB4GrAgnmL6Bcj4qIVKIe8kdVadIEe27B90bOG/3Er1rYJq1wibyh+4Q5CMzRllMXDo5euMAAAGfSURBVFjD7dblUwJBGAbw5aSlBJRGQERBkLC7u7u7u7veP90jDnaEcdhjP+k9X5h9Zu43O7PLe4eQECH/KGsIaUooOEcLK75LpehH628idSrE+nMANfyQ3MY2BRm0C6mM462tUwJAJtVyUB1WmsoSFZEk46D6TBcYS3UKPpCYawxD5VxHImVD/RHIxMQbGintkGQcppkcOkuutQPYfkDfmjck556ZTSydve2YY5UWk0Mww672VPh+XFqCU8tA+whtL+KOpa+bF3Rh8B4ymDNaSnSzG9IPIpsL34/HTPZfS58auMPYuYNMWcQXOsD3U9ZDOkZkkCvqwSIqUI2WfEDmgiQxRANiIp8GKtDLO6/Znw19oOdXhKoROtEUBr1F5Y9f4dt1XygqKgh6YqcHwMQkQBWICr1H6czTgrpoQde0IGnekJEWNEwLMv/GPDDB/M/fDioVeLYA5GqoYt+xNRY4toJkCiBUG7vTEVxJu2Z549RbqXQuba7uVDZWO66mgw6d7kYaEPvvCb+REIp/srGzLP4aa0n8zKFkKUSIkD+Qb9QrYMvxAbaBAAAAAElFTkSuQmCC';

exports = module.exports = instance;
