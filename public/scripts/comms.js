// WebSocket communication module
// Handles all websocket connection and management logic

const LL_None = 0;
const LL_Sparse = 1;
const LL_Info = 6;
const LL_All = 9;

let LogLevel = LL_Sparse;
const LL_Dev = LogLevel + 1;

let isConnected = false;
let ShouldConnect = true;
let socket = null;

let reconnectInterval = 1000; // Start with 1 second
const maxInterval = 30000; // Maximum interval of 30 seconds

// Callback functions that can be set by the HTML page
let onWebSocketConnected = null;
let onWebSocketDisconnected = null;
let onWebSocketError = null;

// Getter function to expose connection status
function getConnectionStatus() {
    return isConnected;
}

function connectWebSocket() {
    if (ShouldConnect != true) return;

    // Determine WebSocket URL based on current location
    var wsProtocol = (window.location.protocol === 'https:') ? 'wss://' : 'ws://';
    var wsURL = wsProtocol + window.location.host + '/'; // Use appropriate path

    // Create a new WebSocket
    socket = new WebSocket(wsURL);

    // Connection opened
    socket.addEventListener('open', function (event) {
        isConnected = true;
        if (LogLevel >= LL_Sparse) console.log('Connected to WebSocket');
        // Call the connected callback if it exists
        if (typeof onWebSocketConnected === 'function') {
            onWebSocketConnected();
        }
    });

    // Listen for messages
    socket.addEventListener('message', function (event) {
        if (LogLevel >= LL_Dev) console.log('Message from server:', event.data);
        // Call handleZTMessage if it exists globally
        if (typeof handleZTMessage === 'function') {
            handleZTMessage(event);
        }
    });

    // Handle any errors that occur.
    socket.addEventListener('error', function (event) {
        if (LogLevel >= LL_Sparse) console.error('WebSocket Error:');
        isConnected = false;
        // Call the error callback if it exists
        if (typeof onWebSocketError === 'function') {
            onWebSocketError(event);
        }
        socket.close(); // Ensure WebSocket is closed before trying to reconnect
    });

    // Listen for possible close
    socket.addEventListener('close', function (event) {
        if (LogLevel >= LL_Sparse) console.log('WebSocket connection closed:');
        isConnected = false;
        // Call the disconnected callback if it exists
        if (typeof onWebSocketDisconnected === 'function') {
            onWebSocketDisconnected();
        }
        reconnectWebSocket();
    });
}

function reconnectWebSocket() {
    setTimeout(() => {
        if (LogLevel >= LL_Sparse) console.log("Attempting to reconnect...");
        connectWebSocket();
        // Increase the interval for next reconnection attempt
        reconnectInterval = Math.min(maxInterval, reconnectInterval * 2);
    }, reconnectInterval);
}

function sendToServer(message) {
    if (isConnected) {
        socket.send(message);
        return true;
    } else {
        return false;
    }
}

// Initialize connection when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    connectWebSocket();
});

// Clean up connection when page is unloading
window.addEventListener("beforeunload", () => {
    ShouldConnect = false;
    if (socket != null) {
        socket.close();
    }
});

