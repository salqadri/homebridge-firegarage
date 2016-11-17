const path_RE = /\{\$[^${]+\}/g;
var Service, Characteristic, DoorState;
var Firebase = require('firebase');

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
        this.target_state_path = config.target_state_path;
        this.current_state_path = config.current_state_path;
        this.trigger_path = config.trigger_path;
        this.auth_method = config.auth_method;
        this.auth_credentials = config.auth_credentials;
        this._state = false;
        
        this._db = new Firebase(this.server);

        this._db.onAuth(function(authData) {
            if (authData) {
                // parse the path
                var uid = self._db.getAuth().uid;
                var paths = [this.target_state_path, this.current_state_path, this.trigger_path];
                for (var i = 0; i < paths.length; i++) {
                    //Do something
                    paths[i] = paths[i].replace("{$uid}", uid);
                }
            } else {
                // try to authorize
                self._authorize();
            }
        });
        
    }
    
    _authorize() {
        switch (this.auth_method) {
            case 'password':
                this.log("firegarage: authWithPassword");
                this._db.authWithPassword(this.auth_credentials);
                break;
            case 'customtoken':
                this.log("firegarage: authWithCustomToken");
                this._db.authWithCustomToken(this.auth_credentials);
                break;
            case 'anonymously':
                this.log("firegarage: authAnonymously");
                this._db.authAnonymously();
                break;
        }
    }

    getTargetState(callback) {
        this.log("firegarage: getTargetState requested");
        this._db.child(this.target_state_path).once("value", function(snapshot) {
            callback(null, snapshot.val());
        });
    }

    getCurrentState(callback) {
        this.log("firegarage: getCurrentState requested");
        this._db.child(this.current_state_path).once("value", function(snapshot) {
            callback(null, snapshot.val());
        });
    }
    
    setTargetState(val, callback) {
        this.log("firegarage: setTargetState " + val);
        this._db.child(this.target_state_path).set(val).then(function() {
            callback(null, val);
        })
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
