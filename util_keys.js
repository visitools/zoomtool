// Keyboard registration system for managing keypress handlers

const keyboardHandlers = new Map();

/**
 * Register a keypress handler with metadata
 * @param {string} key - The key to bind (e.g., 'a', 'q', '1')
 * @param {Function} handler - The function to call when key is pressed
 * @param {string} description - Description of what the key does
 * @param {string} group - Group name for related keypresses (e.g., 'Meeting Control', 'Device Settings')
 */
function registerKeypress(key, handler, description, group = 'General') {
    // Check if key is already registered
    if (keyboardHandlers.has(key)) {
        const existing = keyboardHandlers.get(key);
        console.log(`Warning: Attempted to register key '${key}' multiple times`);
        console.log('Existing registration:');
        console.log(`- Group: ${existing.group}`);
        console.log(`- Description: ${existing.description}`);
        console.log('New registration:'); 
        console.log(`- Group: ${group}`);
        console.log(`- Description: ${description}`);
        return;
    }
    
    keyboardHandlers.set(key, {
        handler,
        description,
        group,
        key
    });
}

/**
 * Unregister a keypress handler
 * @param {string} key - The key to unbind
 * @returns {boolean} True if handler was removed, false if it didn't exist
 */
function unregisterKeypress(key) {
    return keyboardHandlers.delete(key);
}

/**
 * Get handler for a specific key
 * @param {string} key - The key to look up
 * @returns {Object|undefined} Handler object or undefined if not found
 */
function getKeypressHandler(key) {
    return keyboardHandlers.get(key);
}

/**
 * Get all registered keypresses grouped by category
 * @returns {Object} Object with group names as keys and arrays of handler info as values
 */
function getKeypressGroups() {
    const groups = {};
    keyboardHandlers.forEach((value, key) => {
        if (!groups[value.group]) {
            groups[value.group] = [];
        }
        groups[value.group].push({
            key: value.key,
            description: value.description
        });
    });
    return groups;
}

/**
 * Get all registered keypresses as a flat array
 * @returns {Array} Array of handler info objects
 */
function getAllKeypresses() {
    return Array.from(keyboardHandlers.values());
}

/**
 * Print all registered keypresses organized by group
 */
function showKeyboardHelp() {
    const groups = getKeypressGroups();
    console.log('\n=== Available Keyboard Commands ===');
    Object.keys(groups).sort().forEach(groupName => {
        console.log(`\n${groupName}:`);
        groups[groupName].forEach(item => {
            console.log(`  ${item.key} - ${item.description}`);
        });
    });
    console.log('\n');


    // Show available unregistered keys
    console.log('\n=== Available Unregistered Keys ===');
    
    // Get currently registered keys
    const registeredKeys = new Set(Array.from(keyboardHandlers.keys()));
    
    // Define standard keyboard characters
    const standardKeys = new Set([
        // Letters
        'a','b','c','d','e','f','g','h','i','j','k','l','m',
        'n','o','p','q','r','s','t','u','v','w','x','y','z',
        // Numbers
        '1','2','3','4','5','6','7','8','9','0',
        // Special characters (common between US/UK)
        '-','=','[',']',';',"'",'\\',',','.','/',
        // Function keys
        'f1','f2','f3','f4','f5','f6','f7','f8','f9','f10','f11','f12'
    ]);

    // Find unregistered keys
    const availableKeys = Array.from(standardKeys)
        .filter(key => !registeredKeys.has(key))
        .sort();

    // Display available keys in columns
    const columns = 8;
    for(let i = 0; i < availableKeys.length; i += columns) {
        const row = availableKeys.slice(i, i + columns)
            .map(k => k.padEnd(4))
            .join(' ');
        console.log(`  ${row}`);
    }
    console.log('\n');
}

/**
 * Process a keypress event
 * @param {Object} key - Key event object from readline
 * @returns {boolean} True if handler was found and executed, false otherwise
 */
function handleKeypress(key) {
    if (!key || !key.name) return false;

    const handler = keyboardHandlers.get(key.name);
    if (handler) {
        try {
            handler.handler();
            return true;
        } catch (error) {
            console.error(`Error executing keypress handler for '${key.name}':`, error);
            return false;
        }
    }
    return false;
}

/**
 * Clear all registered keypress handlers
 */
function clearAllKeypresses() {
    keyboardHandlers.clear();
}

module.exports = {
    registerKeypress,
    unregisterKeypress,
    getKeypressHandler,
    getKeypressGroups,
    getAllKeypresses,
    showKeyboardHelp,
    handleKeypress,
    clearAllKeypresses
};
