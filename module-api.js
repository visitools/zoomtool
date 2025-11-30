const path = require('path');

const {registerModule} = require(path.join(global.BaseDir, 'index'));
const {registerKeypress } = require(path.join(global.BaseDir, 'util_keys.js'));
const {zosc,config} = require(path.join(global.BaseDir, 'index.js'));

const {server,broadcastMessage, wsEmitter
    ,registerRoute,unregisterRoute
    ,serveFile,publicPath
    ,checkPermissions,rejectRequest} = require(path.join(global.BaseDir, 'server.js'));


module.exports = {
    registerModule,
    registerKeypress,
    registerRoute, unregisterRoute,
    serveFile,
    publicPath, checkPermissions, rejectRequest,

    broadcastMessage, wsEmitter,

    zosc, config
}
