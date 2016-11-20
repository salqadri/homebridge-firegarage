const path_RE = /\{\$[^${]+\}/g;
var Service, Characteristic, DoorState;
var firebase = require('firebase');

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
        this._state = false;
        
        var config = {
            apiKey: this.api_key,
            authDomain: this.auth_domain,
            databaseURL: this.server
        };
        firebase.initializeApp(config);
        this._db = firebase.database();
        this._auth = firebase.auth();

        this._auth.onAuthStateChanged(function(user) {
          if (user) {
            // User signed in!
            var uid = user.uid;
            self.log("firegarage: Authenticated");
            var paths = [self.target_state_path, self.current_state_path, self.trigger_path];
            for (var i = 0; i < paths.length; i++) {
                //Do something
                paths[i] = paths[i].replace("{$uid}", uid);
            }
          } else {
            // User logged out
            self._authorize();
          }
        });
    }
    
    _authorize() {
        var self = this;
        switch (this.auth_method) {
            case 'password':
                self.log("firegarage: authWithPassword");
                self._auth.signInWithEmailAndPassword(self.auth_credentials["email"], self.auth_credentials["password"]).catch(function(error) {
                  // Handle Errors here.
                  var errorCode = error.code;
                  var errorMessage = error.message;
                  self.log("Auth Error " + errorCode + ": " + error.message);
                });
                break;
            case 'customtoken':
                self.log("firegarage: authWithCustomToken");
                firebase.auth().signInWithCustomToken(self.auth_credentials).catch(function(error) {
                  // Handle Errors here.
                  var errorCode = error.code;
                  var errorMessage = error.message;
                  self.log("Auth Error " + errorCode + ": " + error.message);
                });
                break;
            case 'anonymously':
                self.log("firegarage: authAnonymously");
                firebase.auth().signInAnonymously().catch(function(error) {
                  // Handle Errors here.
                  var errorCode = error.code;
                  var errorMessage = error.message;
                  self.log("Auth Error " + errorCode + ": " + error.message);
                });
                break;
        }
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
        this.log("firegarage: setTargetState " + val);
        this._db.ref(this.target_state_path).set(val).then(function() {
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
