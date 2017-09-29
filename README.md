# homebridge-firegarage
Homebridge plugin to set/get values in Firebase.

## Installation

npm install -g homebridge-firegarage

## Firebase Setup
* Setup a project at https://console.firebase.google.com
* Click "Add another App"
* Choose "Web"
* Copy the generated values for apiKey, authDomain and databaseURL

## Homebridge Configuration

Add this to your '~/.homebridge/config.json' as an accessory:
```
{
    "accessory": "FireGarage",
    "name": "My Garage",
    "server": "https://myserver.firebaseio.com",
    "target_state_path": "/path/to/my/taget_state/value",
    "current_state_path": "/path/to/my/current_state/value",
    "trigger_path": "/path/to/my/trigger/value",
    "service_account": {
        ...
    }
}
```
* server: This is the database server hostname assigned to your Firebase instance
* target_state_path: This is the path in the database to set the target state of the garage. If the target state is open, the value will be 0, and if the target state is to be closed, the value will be 1.
* current_state_path: This is the path in the database to read the current state of the garage. The state must be either 0 to represent the garage being open, or 1 to represent the garage being closed.
* trigger_path: This is the path in the database to a trigger field. Whenever the garage state needs to be changed, this trigger value will be set to 1 for 1 second.
* service_account: Copy-paste the json in your serviceAccountKey.json file that you get by following the steps [here]( https://firebase.google.com/docs/admin/setup).

