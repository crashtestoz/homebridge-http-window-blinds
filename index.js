var Service;
var Characteristic;

const request = require('request');

const DEF_MIN_OPEN = 0,
      DEF_MAX_OPEN = 100,
      DEF_TIMEOUT = 5000;

module.exports = homebridge => {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory(
		"homebridge-http-window-blinds",
		"HttpWindowBlinds",
		HttpWindowBlinds);
};

function HttpWindowBlinds(log, config) {
	this.service = new Service.WindowCovering(this.name);
    	this.log = log;
	this.name = config.name || "Window Blinds";
	this.model = config["model"] || "nodeMCU based DIY motorised blinds";
	this.manufacturer = "@crashtestoz";
	this.outputValueMultiplier = config.outputValueMultiplier || 1;
	this.urlSetTargetPosition = config.urlSetTargetPosition;
	this.urlGetCurrentPosition = config.urlGetCurrentPosition;
	this.serial = config["serial"] || "HWB02";
   	this.timeout = config["timeout"] || DEF_TIMEOUT;
   	this.minOpen = config["min_open"] || DEF_MIN_OPEN;
   	this.maxOpen = config["max_open"] || DEF_MAX_OPEN;
	
	this.currentPosition = 0;
	this.targetPosition = 100;
	
	this.positionState = Characteristic.PositionState.STOPPED;
	this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
}	

HttpWindowBlinds.prototype = {
	identify: function(callback) {
		this.log("Identify requested!");
		callback(null);
	},
	
	getName: function(callback) {
		this.log("getName :", this.name);
		callback(null, this.name);
	},

	getCurrentPosition: function(callback) {
		var ops = {
         		uri:    this.urlGetCurrentPosition,
         		method: "GET",
         		timeout: this.timeout
      		};
		//GetCode here
		request(ops, (error, response, body) => {
			var value = null;
         		if (error) {
            			this.log('HTTP bad response (' + ops.uri + '): ' + error.message);
         		} else {
            			try {
               				value = JSON.parse(body).position;
               				if (value < this.minOpen || value > this.maxOpen || isNaN(value)) {
						throw "Invalid value received";
               				}
               				this.log('HTTP successful response: ' + body);
					this.currentPosition = value;
					this.service.setCharacteristic(Characteristic.CurrentPosition, this.currentPosition);
					this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
					
            			} catch (parseErr) {
               				this.log('Error processing received information: ' + parseErr.message);
               				error = parseErr;
					
            			}
         		}
			callback(error, this.currentPosition);
		});	
	},
	getTargetPosition: function(callback){
		this.log("getTargetPosition :", this.targetPosition);
		this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
		callback(null, this.targetPosition);
	},
	setTargetPosition: function(value, callback) {
		this.log("setTargetPosition from %s to %s", this.targetPosition, value);
		this.targetPosition = value;

		if (this.targetPosition > this.currentPosition) {
			this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.INCREASING);
		} else if (this.targetPosition < this.currentPosition) {
			this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.DECREASING);
		} else if (this.targetPosition = this.currentPosition) {
			this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
		}

		request((this.urlSetTargetPosition.replace('%VALUE%', Math.round (value * this.outputValueMultiplier))), (error, response, body) => {
			this.currentPosition = this.targetPosition;
			this.service.setCharacteristic(Characteristic.CurrentPosition, this.currentPosition);
			this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
			this.log("currentPosition is now %s", this.currentPosition);
			callback(null);
		});
	},
	getPositionState: function(callback) {
		this.log("getPositionState :", this.positionState);
		callback(null, this.positionState);
	},
	getServices: function() {
		var informationService = new Service.AccessoryInformation();

		informationService
			.setCharacteristic(Characteristic.Manufacturer, "Peter Chodyra")
			.setCharacteristic(Characteristic.Model, "HTTP Window Blinds")
			.setCharacteristic(Characteristic.SerialNumber, "HWB02");

		this.service
			.getCharacteristic(Characteristic.Name)
			.on('get', this.getName.bind(this));

		this.service
			.getCharacteristic(Characteristic.CurrentPosition)
			.on('get', this.getCurrentPosition.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetPosition)
			.on('get', this.getTargetPosition.bind(this))
			.on('set', this.setTargetPosition.bind(this));

		this.service
			.getCharacteristic(Characteristic.PositionState)
			.on('get', this.getPositionState.bind(this));

		return [informationService, this.service];
	}
}
