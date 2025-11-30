/*const main = require(path.join(global.BaseDir, 'index'))

if (main.config.RollCall_Modules == true) { console.log("Module test loaded"); }

const {server,broadcastMessage, wsEmitter
    ,registerRoute,unregisterRoute
    ,serveFile,publicPath
    ,checkPermissions,rejectRequest} = require(path.join(global.BaseDir, 'server.js'));
*/
const path = require('path');
const moduleapi = require(path.join(global.BaseDir, 'module-api.js'));

const success = moduleapi.registerModule("1.0", exports, "test", "Test Module");
if (success != true) { return; }

moduleapi.registerRoute("/test", function(req, res, authInfo) {
    return serveFile(__dirname + '/test.html', res);
});
