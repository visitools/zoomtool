const path = require('path');
const moduleapi = require(path.join(global.BaseDir, 'module-api.js'));


const success = moduleapi.registerModule("1.0", exports, "BASICUI", "Basic UI Module");
if (success != true) { return; }



moduleapi.registerRoute("/basicui/", function(req, res, authInfo) {

    const URL = req.url.toLowerCase();

    var requestPath = req.url;
    if (requestPath.includes('?')) {
        requestPath = requestPath.split('?')[0];
    }
    const pathParams = requestPath.split('/');
    var cmd = "";
    if (pathParams.length > 2) {
        cmd = pathParams[2];
    }
    if (cmd == "start") {

        res.writeHead(200, {'Content-Type': 'text/html'}); 
        return res.end("OK");
    }

    return moduleapi.serveFile(__dirname + '/pages/barebones.html', res);
});



moduleapi.wsEmitter.on("message", function(message) {
    if (Buffer.isBuffer(message)) {
        message = message.toString('utf8');
    }
    
    let prefix = "BASICUI.";
    // Use prefixes to filter module-specific messages
    if (message.startsWith(prefix)) {

        const commandline = message.substring(prefix.length);
        const command = commandline.includes(' ') ? commandline.substring(0, commandline.indexOf(' ')) : commandline;
        const params = commandline.includes(' ') ? commandline.substring(commandline.indexOf(' ') + 1) : '';
  

        if (command == "TEST1") {
            moduleapi.broadcastMessage("BASICUI.Test 1 was pressed");
        }
        if (command == "TEST2") {
            moduleapi.broadcastMessage("BASICUI.Test 2 was pressed");
        }
        if (command == "TEST3") {
            moduleapi.broadcastMessage("BASICUI.Test 3 was pressed");
        }
        if (command == "TEST4") {
            moduleapi.broadcastMessage("BASICUI.Test 4 was pressed");
        }

    }
    
});