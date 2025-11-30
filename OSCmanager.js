const { EventEmitter } = require("events");
const { Server, Client } = require('node-osc');
const { spawn, exec } = require('child_process');

class OSCmanager extends EventEmitter {
    constructor(transmissionIp, transmissionPort, receivingport) {
        super();
        this.ShowAllOSC = false;

        this.transmissionIp = transmissionIp;
        this.transmissionPort = transmissionPort;
        this.receivingport = receivingport;

        this.oscServer;
        this.oscClient;
        this.oscPassThrough;
        this.Passthrough;

        this.Passthrough = false;

        this.oscServer = new Server(this.receivingport, "0.0.0.0");
        this.oscClient = new Client(this.transmissionIp, this.transmissionPort);

        this.oscServer.on("message", (message) => {
            this.handlePassthrough(message);
        });
        this.oscServer.on("message", (message) => {
            this.handleOSCmessage(message);
        });
    }

    setPassthrough(DestIP, DestPort) {
        this.oscPassThrough = new Client(DestIP, DestPort);
        this.Passthrough = true;
    }

    handlePassthrough(message) {
        if (this.Passthrough == true) {
            this.oscPassThrough.send(message);
        }
    }

    handleOSCmessage(message) {
        if (global.ShowAllOSC == true) console.log("DBGOSC:", message);
        this.emit("OSCmessage", message);
    }

    sendZoomCommand(command, data) {
        if (global.ShowAllOSC == true) console.log("DBGCMD:" + command);

        let oscURL = "/zoom/" + command;
        if (data != undefined) {
            this.oscClient.send(oscURL, data);
        } else {
            this.oscClient.send(oscURL);
        }
    }


}

module.exports = OSCmanager;
