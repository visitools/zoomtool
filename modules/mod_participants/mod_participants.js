// Module to keep track of participants and their status

/*const main = require(path.join(global.BaseDir, 'index'));
const { registerKeypress } = require(path.join(global.BaseDir, 'util_keys.js'));
const {zosc,config} = require(path.join(global.BaseDir, 'index.js'));
if (main.config.RollCall_Modules == true) { console.log("Module Participants loaded"); }

const {server,broadcastMessage, wsEmitter
    ,registerRoute,unregisterRoute
    ,serveFile,publicPath
    ,checkPermissions,rejectRequest} = require(path.join(global.BaseDir, 'server.js'));
*/
const path = require('path');
const moduleapi = require(path.join(global.BaseDir, 'module-api.js'));

const {zosc,} = require(path.join(global.BaseDir, 'module-api.js'));


const success = moduleapi.registerModule("1.0", exports, "participants", "Participants Module");
if (success != true) { return; }

//  Register the web page that will display the participants list

moduleapi.registerRoute("/participants", function(req, res, authInfo) {
    return serveFile(__dirname + '/participants.html', res);
});


//  Handle incoming OSC messages from ZoomOSC/ISO
moduleapi.zosc.on("OSCmessage",(msg) => {

    if (msg.length < 1) return;

    if (msg[0].endsWith('/user/list') && (msg.length>11)) {

        // Collect all available data from the message into variables
    
        const userName    = msg[2];
        const userID      = msg[4];

        const onlineCount = msg[6];
        const userRole    = msg[7];
        
        const onlineState = msg[8];
        const videoState  = msg[9];
        const audioState  = msg[10];
        const handState   = msg[11];

        // Add or remove the participant from the list based on the online state
        if (onlineState == "1") {
            AddParticipant(userID, userName, userRole, videoState, audioState, handState);
        } else if (onlineState == "0") {
            RemoveParticipant(userID);
        }

        // Broadcast the participant data to the web UI
        moduleapi.broadcastMessage("part,"
            + onlineCount+","+onlineState +","+userID+","+userRole+","+videoState+","+audioState+","+handState+","+userName);
    }

});


//  Handle incoming messages from the web UI
function handleParticipantWebMessage(message) {
    if (Buffer.isBuffer(message)) {
        message = message.toString('utf8');
    }

    const comandPrefix = "PARTICIPANTS.";
    // Use prefixes to filter module-specific messages
    if (message.startsWith(comandPrefix)) {
        const commandline = message.substring(comandPrefix.length);
        const command = commandline.includes(' ') ? commandline.substring(0, commandline.indexOf(' ')) : commandline;
        const params = commandline.includes(' ') ? commandline.substring(commandline.indexOf(' ') + 1) : '';

        if (command == "RESET") {
            ResetParticipantList();
        }
    }
}

moduleapi.wsEmitter.on("message", handleParticipantWebMessage);

//  Register keypresses to show the participants list and list the participants
moduleapi.registerKeypress('p', () => {
    console.log("Participants:",GetParticipantList());
 }, 'Show participants', 'Participants');


 moduleapi.registerKeypress('l', () => {
    console.log("List Participants CMD");
    moduleapi.zosc.sendZoomCommand("list");
 }, 'List Participants CMD', 'Participants');
  
//
//
// Participant Data Model and functions
//
//
const participants = new Map();

function ResetParticipantList() {
    participants.clear();
    moduleapi.broadcastMessage("part-reset");
    moduleapi.zosc.sendZoomCommand("list");
}

function AddParticipant(userID, userName, userRole, videoState, audioState, handState) {
    participants.set(userID, {
        name: userName,
        role: userRole,
        online: true,
        video: videoState,
        audio: audioState,
        hand: handState
    });
}

function RemoveParticipant(userID) {
    participants.delete(userID);
}

function GetParticipant(userID) {
    return participants.get(userID);
}

function GetParticipantList() {
    return Array.from(participants.values());
}