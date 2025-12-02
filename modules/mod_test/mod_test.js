const path = require('path');
const moduleapi = require(path.join(global.BaseDir, 'module-api.js'));


const success = moduleapi.registerModule("1.0", exports, "test", "Test Module");
if (success != true) { return; }

moduleapi.registerRoute("/test", function(req, res, authInfo) {
    return serveFile(__dirname + '/test.html', res);
});
