const path_RE = /\{\$[^${]+\}/g;
var Service, Characteristic, DoorState;
var admin = require('firebase-admin');

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    DoorState = homebridge.hap.Characteristic.CurrentDoorState;
    
    homebridge.registerAccessory("homebridge-firegarage", "FireGarage", fireGarage);
};

class fireGarage {
    constructor(log, config) {
        var self = this;
        this.log = log;
        this.name = config.name;
        this.server = config.server;
        this.auth_domain = config.auth_domain;
        this.api_key = config.api_key;
        this.target_state_path = config.target_state_path;
        this.current_state_path = config.current_state_path;
        this.trigger_path = config.trigger_path;
        this.auth_method = config.auth_method;
        this.auth_credentials = config.auth_credentials;
        this.service_account = config.service_account;
        this._state = false;
        
        admin.initializeApp({
          credential: admin.credential.cert(self.service_account),
          databaseURL: self.server
        });
        this._db = admin.database();

        this._db.ref(self.current_state_path).on("value", function(snapshot) {
            var val = snapshot.val();
            self.log("State of garage changed: " + val);
            self.currentDoorState.setValue(val);
            self.targetDoorState.setValue(val);
        });
    }

    getTargetState(callback) {
        var self = this;
        this.log("firegarage: getTargetState requested");
        this._db.ref(this.target_state_path).once("value", function(snapshot) {
            var val = snapshot.val();
            self.log("firegarage: getTargetState is " + val);
            callback(null, val);
        });
    }

    getCurrentState(callback) {
        var self = this;
        this.log("firegarage: getCurrentState requested");
        this._db.ref(this.current_state_path).once("value", function(snapshot) {
            var val = snapshot.val();
            self.log("firegarage: getCurrentState is " + val);
            callback(null, val);
        });
    }
    
    setTargetState(val, callback) {
	var self = this;
        this.log("firegarage: setTargetState " + val);
	var updates = {};
	updates[self.target_state_path] = val;
	updates[self.trigger_path] = 1;
        this._db.ref().update(updates).then(function() {
                setTimeout(function() {
                    self._db.ref(self.trigger_path).set(0);
                    callback(null, val);
                }, 500);
        });
    }
    
    identify(callback) {
        this.log("firegarage: Identify requested");
        callback();
    }
    
    getServices() {
        this.log("firegarage: getServices requested");
        this.garageDoorOpener = new Service.GarageDoorOpener(this.name,this.name);
        this.currentDoorState = this.garageDoorOpener.getCharacteristic(DoorState);
        this.currentDoorState.on('get', this.getCurrentState.bind(this))
        this.targetDoorState = this.garageDoorOpener.getCharacteristic(Characteristic.TargetDoorState);
        this.targetDoorState.on('set', this.setTargetState.bind(this));
        this.targetDoorState.on('get', this.getTargetState.bind(this));

        this.infoService = new Service.AccessoryInformation();
        this.infoService
            .setCharacteristic(Characteristic.Manufacturer, "Opensource Community")
            .setCharacteristic(Characteristic.Model, "Firebase GarageDoorOpener")
            .setCharacteristic(Characteristic.SerialNumber, "Version 1.0.0");
            
        return [this.garageDoorOpener, this.infoService];
    }
}
