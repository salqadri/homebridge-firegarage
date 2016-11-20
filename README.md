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
    "auth_domain": "myserver.firebaseio.com",
    "server": "https://myserver.firebaseio.com",
    "api_key": "R3plac3ThisWithY0urAP1KeyFr0mTh3Consol3"
    "target_state_path": "/path/to/my/taget_state/value",
    "current_state_path": "/path/to/my/current_state/value",
    "trigger_path": "/path/to/my/trigger/value",
    "auth_method": "password",
    "auth_credentials": {
        "email": "email@example.com",
        "password": "very_secret_password"
    }
}
```
* auth_domain: The auth domain assigned to your Firebase instance
* server: This is the database server hostname assigned to your Firebase instance
* api_key: The API Key of your Firebase project
* target_state_path: This is the path in the database to set the target state of the garage. If the target state is open, the value will be 0, and if the target state is to be closed, the value will be 1. This can use [variable expansion](#variables).
* current_state_path: This is the path in the database to read the current state of the garage. The state must be either 0 to represent the garage being open, or 1 to represent the garage being closed. This can use [variable expansion](#variables).
* trigger_path: This is the path in the database to a trigger field. Whenever the garage state needs to be changed, this trigger value will be set to 1 for 1 second. This can use [variable expansion](#variables).
* auth_method: This is the authentication method used to authenticate against the Firebase instance. Options are:
    * "password" to use [signInWithEmailAndPassword()](https://firebase.google.com/docs/auth/web/password-auth)
    * "customtoken" to use [signInWithCustomToken()](https://firebase.google.com/docs/auth/web/custom-auth)
    * "anonymously" to use [signInAnonymously()](https://firebase.google.com/docs/auth/web/anonymous-auth)
* auth_credentials: This is the authentication credentials to use with auth_method. For:
    *  "password" this should be a JSON object containing the email and password values.
    *  "customtoken" this should be a string containing a token generated in the Firebase console.
    *  "anonymously" this is ignored.


### Variables
Variables in the path are set in curly braces like:
```
{$var_name}
```
Variables are expanded after authorization is complete.
##### Supported Variables
* {$uid} - The result of firebase_database.getAuth().uid
