const path = require('path');
global.BaseDir = __dirname;


// Set up paths and filenames, using defaults if these variables are not already defined
// This allows a different startup script to override these settings

global.ConfigDir = global.ConfigDir ?? __dirname;
global.ConfigFile = global.ConfigFile ?? path.join(__dirname, 'config.json');

global.ModuleDir = global.ModuleDir ?? path.join(__dirname, './modules');
global.AltModuleDir = global.AltModuleDir ?? path.join(__dirname, './modules_alt');
global.AuthDir = global.AuthDir ?? path.join(__dirname, './');

const fs = require('fs');
const fsPromises = fs.promises;


// Basic application configuration
global.WebserverPort = 8082;
const KeyboardUI = true;           // This enables/disables the keyboard UI for the application

global.UseAlternatePort = false;


// debugging support
global.SoundOff = false;            // This makes each module "Sound off" and identify itself on startup
global.ShowAllOSC = false;




///////////////////////////////////////

// Load application configuration

const DefaultConfig =
{
    "WebserverPort":8086,

    "OSCserverIP":"127.0.0.1",
    "OSCserverPortIn":9090,
    "OSCserverPortOut":1236,

    "PassthroughMessages":false,
    "PassthroughIP":"",
    "PassthroughPort":1234,
};

let config = DefaultConfig

// We could fall back to the default config if the config file is not found
// but I prefer to ensure a config file is used
if (loadConfig() != true) {
    console.log("Failed to load configuration");
    process.exit(0);
}



///////////////////////////////////////

// I consider the webserver port as a critical setting, so if it is not found, exit
if (config.WebserverPort != undefined) {
    global.WebserverPort = config.WebserverPort;
} else {
    console.log("Failed to load configuration: WebserverPort not found");
    process.exit(0);
}



// Command line overrides

const args = process.argv.slice(2); // Get command-line arguments

if (args.includes("-dbgosc")) {
    global.ShowAllOSC = true;
} 


if (args.includes("-altport")) {
    global.UseAlternatePort = true;
} 
if (args.includes("-altoscports")) {
    global.UseAlternateOSCPorts = true;
} 

if (global.UseAlternatePort  == true) {  global.WebserverPort = 8084; }


// These *must* be defined after the webServerPort is set
const {server,broadcastMessage, wsEmitter,registerRoute} = require('./server.js');



global.registerKeypress = function (...args) {
    // Forward to the registerKeypress function in util_keys.js
    // util_keys should be required here (once and cached)
    if (!global._util_keys) {
        global._util_keys = require('./util_keys.js');
    }
    return global._util_keys.registerKeypress(...args);
};


// Module handler

let loadedModules = {};
function registerModule(apiVersion, mod, shortname, title) {

    if (apiVersion == "" || !mod || !shortname || !title) {
        console.log("Failed to register module: "+shortname+" - Invalid module data");
        return false; // Indicate failure
    }
    global.loadedModules = global.loadedModules || {};

    if (global.loadedModules[shortname]) {
        console.log("Failed to register module: "+shortname+" - Module with this name already exists");
        return false; // Module with this name already exists
    }
    
    global.loadedModules[shortname] = {
        apiVersion: apiVersion,
        mod: mod,
        title: title
    };
    if (global.SoundOff == true) {
        console.log(`Registered: ${shortname} - ${title}`);
    }
    return true; // Indicate success
  };
  







function includeIfExists(filePath) {
    if (fs.existsSync(filePath)) {
        return require(filePath);
    } else {
        console.log("Failed to find " + filePath);
    }
    return null;
}

function loadModule(modName) {
    const modulePath = path.join(__dirname, modName);
    return includeIfExists(modulePath)
}




// Load keyboard utilities
const { registerKeypress, showKeyboardHelp, handleKeypress } = require('./util_keys.js');

// Install keyboard interface
if (KeyboardUI == true) {
    const readline = require('readline');

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    // Register a keypress to quit the application so that it appears in the key list
    // but we will handle it outside of the keypress handler
    registerKeypress('q', () => {
        process.exit(0);
    }, 'Quit', 'System');

    process.stdin.on("keypress", (str, key) => {
        if (key.name == 'q') process.exit(0);

        handleKeypress(key);

    });
}




registerKeypress('h', () => {
    showKeyboardHelp();
}, 'Show keyboard help', 'System');

registerKeypress('f1', () => {
    showKeyboardHelp();
}, 'Show keyboard help', 'System');








// Install OSC Listener
const OSCmanager = require('./OSCmanager');


let zOSCin = config.OSCserverPortIn;
let zOSCout = config.OSCserverPortOut;

if (global.UseAlternateOSCPorts == true) {
    zOSCin = 9191;
    zOSCout = 9190;
}


if (global.SoundOff == true) { console.log("OSC Params : "+config.OSCserverIP+"   "+zOSCin+"   "+zOSCout) }


// Create the default OSC manager instance to talk to ZoomOSC/ISO
let zosc = new OSCmanager(config.OSCserverIP,zOSCin,zOSCout);
if (config.PassthroughMessages == true) zosc.setPassthrough(config.PassthroughIP,config.PassthroughPort);



// install basic broadcast of ZoomOSC/ISO messages to the web UI
zosc.on("OSCmessage",(msg) => {

    if (msg.length < 1) return;


    if ( msg[0].endsWith('/user/videoOn')) {

    }

    if ( msg[0].endsWith('/user/videoOn')
        || msg[0].endsWith('/user/videoOff')
        || msg[0].endsWith('/user/mute')
        || msg[0].endsWith('/user/unMute')
        || msg[0].endsWith('/user/userNameChanged')
        || msg[0].endsWith('/user/online')
        || msg[0].endsWith('/user/offline')
        || msg[0].endsWith('/user/handRaised')
        || msg[0].endsWith('/user/handLowered')
    ){
        if (msg.length>4) {
            let notification = msg[0].substring(msg[0].indexOf('/user/') + '/user/'.length);
            broadcastMessage(notification+":"+msg[4]+":"+msg[2]);
        }
    }
    if (msg[0].endsWith('/user/list') && (msg.length>11)) {
        const onlineState = msg[8];
        const videoState  = msg[9];
        const audioState  = msg[10];
        const handState   = msg[11];

        broadcastMessage("list-"
            + onlineState
            + videoState
            + audioState
            + handState
            + ":"+msg[4]+":"+msg[2]);
    }






});



function loadConfig(AltConfig="") {
    const configPath = global.ConfigFile
    try {
        let newConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config = newConfig;


        if (AltConfig != "") {
            // Load alternate config if specified
            const altConfigKey = "AltConfig_" + AltConfig;
            if (config[altConfigKey]) {
                // Merge the alternate config settings into main config
                Object.assign(config, config[altConfigKey]);
            }
        }

        console.log('Configuration loaded successfully');
        return true;
    } catch(err) {
        console.log('Failed to load configuration');
        console.log(err);
        return false;
    }



}

wsEmitter.on("message",(data) => {

    if (data == "Refresh") {
        broadcastMessage('ClearLists')
        zosc.sendZoomCommand("list");
    }
});










// Load single script modules from the 'modules' directory and larger modules from any folder with a name starting with 'mod_'
async function loadModules(modulesDir="") {
    if (modulesDir == "") {
        return;
    }

    // For historical reasons we load module folders before modules that are single scripts
    if (fs.existsSync(modulesDir)) {
        try {
            // Read all entries in the directory
            const entries = await fsPromises.readdir(modulesDir, { withFileTypes: true });
            

            // First load modules that are a folder with a name starting with 'mod_'

            // Filter for directories that start with 'mod_'
            const modDirs = entries.filter(entry => 
                entry.isDirectory() && entry.name.startsWith('mod_')
            );
    
            // Process each module directory
            for (const dir of modDirs) {
                const moduleName = dir.name;
                const moduleFile = path.join(modulesDir, dir.name, `${dir.name}.js`);
    
                // Check if file exists and load it
                if (fs.existsSync(moduleFile)) {
                    global[moduleName] = require(moduleFile);
                } else {
                    console.log("Failed to find " + moduleFile);
                }
            }



            // Now lod modules that are a single script
            
            // Filter for files that start with 'mod_' and end with '_core.js'
            const coreModules = entries.filter(entry => 
                entry.isFile() && 
                entry.name.startsWith('mod_') && 
                entry.name.endsWith('_core.js')
            );

            // Process each core module file
            for (const file of coreModules) {
                // Extract module name by removing '_core.js' from the end
                const moduleName = file.name.slice(0, -8); // Remove '_core.js' (8 chars)
                const moduleFile = path.join(modulesDir, file.name);

                // Load the module
                try {
                    global[moduleName] = require(moduleFile);
                } catch (err) {
                    console.log(`Failed to load ${moduleFile}: ${err}`);
                }
            }



        } catch (error) {
            console.error('Error loading modules', error);
        }
    



    }


    


}

// Execute the function
loadModules(global.ModuleDir);
if (global.AltModuleDir != "") {
    loadModules(global.AltModuleDir);
}



// function registerModule(moduleName, module) {
// }


module.exports = {
    zosc,
    config,
    KeyboardUI,
    registerKeypress,
    showKeyboardHelp,
    registerModule
}
