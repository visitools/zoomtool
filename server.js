const path = require('path');
const main = require(path.join(global.BaseDir, 'index'))

const LOG_USER_ID = false;
const DEBUG_WSS = true;


const WebSocket = require('ws');
const fs = require('fs');

const EventEmitter = require('events');
class socketEmitter extends EventEmitter {}

const wsEmitter = new socketEmitter();


//
//  There was some authentication code here, but it was removed to keep things simple
//  We'll hide the messages for now



let getAuthDetails;

let authLoaded=false;
try {
    if (global.AuthDir??"" != "") {
        // Try to load from app-auth.js if it exists
        //console.log("Loading authentication from: "+path.join(global.AuthDir, 'app-auth.js'));
        ({ getAuthDetails } = require(path.join(global.AuthDir, 'app-auth.js')));
        authLoaded=true;
    } else {
        console.log("********No authentication directory provided, cannot start app");
        process.exit(1);
    }
} catch (e) {
}

if (authLoaded != true) {
  // Don't provide a fallback if the authentication file or function doesn't exist
  console.log("No authentication method provided, cannot start app");
  process.exit(1);
}



var routes = new Map();

const publicPath = __dirname + '/public';

/*
const https = require('https');
// Load your SSL certificates
const server = https.createServer({
    cert: fs.readFileSync('path/to/cert.pem'),
    key: fs.readFileSync('path/to/key.pem')
});
*/
const http = require('http');
// Load your SSL certificates
const server = http.createServer(handler);

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req) {
    
    ws.allowBroadcast = false;

    // Extract client IP from request
    const clientIP = req.socket.remoteAddress;

    ws.subscribedFlags = 0;
    ws.deniedSubsFlags = 0;

    let userID = resolveUserID(req);
    const authInfo = getAuthDetails(userID);
    if ((authInfo.active??false) != true) {
        ws.close(1008, "Unauthorized");
        if (DEBUG_WSS == true) {
            console.log("Unauthorized connection from: "+clientIP);
        }
        return;
    }

    // Store UserID in websocket object for later reference
    ws.UserID = userID;
    ws.authInfo = authInfo;

    if (authInfo.active == true) { ws.subscribedFlags = ws.subscribedFlags | 1; }


    ws.allowBroadcast = true;

    if (LOG_USER_ID == true) {
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
        console.log(`${timeStr} UserID: ${userID}`);
    }

    ws.on('message', function incoming(message) {
        if (Buffer.isBuffer(message)) {
            // Convert buffer to string
            message = message.toString('utf8');
        }
        wsEmitter.emit("message", message);
    });

    ws.send('CONNECTED');
});



function resolveUserID(req) {

    const clientIP = req.socket.remoteAddress;

    // Check for Cloudflare authenticated user email
    const cfEmail = req.headers['cf-access-authenticated-user-email'];

    // Determine UserID based on conditions
    let userID;

    if (cfEmail) {
        userID = cfEmail;
    } else if (clientIP && clientIP.startsWith('192.168.')) {
        userID = clientIP;
    } else if (clientIP && clientIP.startsWith('127.0.0.1')) {
        userID = clientIP;
    } else if (clientIP && clientIP.startsWith('::1')) {
        userID = clientIP;
    } else {
        // It's not a local user and not a Cloudflare user so use the default user ID
        userID = main.config.DefaultUserID ?? "default";
    }

    return userID;
}



function handler (req, res) { //create server

    let userID = resolveUserID(req);
    const authInfo = getAuthDetails(userID);
    if ((authInfo.active??false) != true) {
        res.writeHead(401, {'Content-Type': 'text/plain'});
        res.end("Unauthorized");
        return;
    }

    const URL = req.url.toLowerCase();

    var requestPath = req.url;
    if (requestPath.includes('?')) {
        requestPath = requestPath.split('?')[0];
    }

    // Deal with specific routes first, and then generic ones
    var handler = routes.get(requestPath);
    if (handler) {
        return handler(req, res, authInfo);
    }
    handler = routes.get(requestPath+"/");
    if (handler) {
        return handler(req, res, authInfo);
    }


    if (!requestPath.endsWith('/')) {
        const parentPath = requestPath.substring(0, requestPath.lastIndexOf('/'));
        var parentHandler = routes.get(parentPath);
        if (parentHandler) {
            return parentHandler(req, res, authInfo);
        }
        parentHandler = routes.get(parentPath+"/");
        if (parentHandler) {
            return parentHandler(req, res, authInfo);
        }

    }

   let pageFilename = '';

    if ((URL =="/") || (URL.startsWith("/index.")) || (URL =="/index") ) {
        pageFilename = __dirname + '/public/index.html';
    }

    let targetPath = path.join(global.BaseDir, 'public', URL);
    if (pageFilename != '') {
        targetPath = pageFilename;
    }
    if (String(targetPath).includes("..")) {
        res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
        return res.end("404 Directory Traversal Attempt");
    }
    
    if (!String(targetPath).includes("..")) {
        if (fs.existsSync(targetPath)) {
            pageFilename = targetPath;
        }
    }

    if (pageFilename == '') {
        res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
        return res.end("404 Requested Page Not Found");
    }

    return serveFile(pageFilename, res);
}

const broadcastMessage = (message,subsFlags = 1) => {
    wss.clients.forEach(function each(client) {
        if (((subsFlags & (client.subscribedFlags??0)) & ~(client.deniedSubsFlags??-1)) !== 0) {
            if (client.readyState === WebSocket.OPEN) {
                if (client.allowBroadcast == true) {
                    client.send(message);
                }
            }
        }
    });
}



server.listen(global.WebserverPort, '0.0.0.0');
console.log("Webserver running on http://localhost:"+global.WebserverPort); 






function registerRoute(path, handler) {

    if (routes.has(path)) {
        //throw new Error(`Route ${path} is already registered.`);
        return false;
    }
    routes.set(path, handler);
    return true;

}

function unregisterRoute(path) {
    if (routes.has(path)) {
        routes.delete(path);
        return true;
    }
    return false;
}

function serveFile(path, res) {
    let fileType='text/html';

    if (path.endsWith(".js")) fileType='text/javascript';
    if (path.endsWith(".css")) fileType='text/css';
    if (path.endsWith(".json")) fileType='application/json';
    if (path.endsWith(".svg")) fileType='image/svg+xml';
    if (path.endsWith(".png")) fileType='image/png';
    if (path.endsWith(".jpg")) fileType='image/jpeg';
    if (path.endsWith(".jpeg")) fileType='image/jpeg';
    if (path.endsWith(".gif")) fileType='image/gif';
    if (path.endsWith(".ico")) fileType='image/x-icon';
    if (path.endsWith(".webp")) fileType='image/webp';
    if (path.endsWith(".mp4")) fileType='video/mp4';
    if (path.endsWith(".mp3")) fileType='audio/mpeg';
    if (path.endsWith(".wav")) fileType='audio/wav';
    if (path.endsWith(".txt")) fileType='text/plain';
    if (path.endsWith(".mov")) fileType='video/quicktime';
    if (path.endsWith(".webm")) fileType='video/webm';


    if (String(path).includes("..")) {
        return send404(res, "404 Directory Traversal Attempt");
    }
    

    fs.readFile(path, function(err, data) { //read file index.html in public folder
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
            return res.end("404 Not Found");
        }
        res.writeHead(200, {'Content-Type': fileType}); //write HTML
        res.write(data); 
        return res.end();
    });
}   

function send404(res, errmsg = "404 Not Found") {
    res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
    return res.end(errmsg);
} 

function send401(res, errmsg = "401 Unauthorized") {
    res.writeHead(401, {'Content-Type': 'text/html'}); //display 401 on error
    return res.end(errmsg);
} 

function checkPermissions(authInfo, appType = "", roleType = "") {
    if (authInfo.active != true) {
        return false;
    }
    // Check if apps property exists before using includes
    if (appType != "" && (!authInfo.apps || !authInfo.apps.includes(appType))) {
        return false;
    }
    // Check if roles property exists before using includes 
    if (roleType != "" && (!authInfo.roles || !authInfo.roles.includes(roleType))) {
        return false;
    }
    return true;
}

function rejectRequest(res, errcode = 401, errmsg = "Unauthorized") {
    res.writeHead(errcode, {'Content-Type': 'text/plain'});
    res.end(errmsg);
}

module.exports = {server
    ,broadcastMessage,wsEmitter
    ,registerRoute,unregisterRoute
    ,serveFile,publicPath
    ,checkPermissions,rejectRequest
    ,send404,send401

};