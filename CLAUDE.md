# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Start the application:
```bash
npm run main
# or
node ./index.js
```

Available command line flags:
- `-altport` - Use alternate port 8084 instead of default 8082
- `-altoscports` - Use alternate OSC ports (9191 in, 9190 out)
- `-dbgosc` - Enable OSC debug output

Build TypeScript (if needed):
```bash
npm run pub
```

## Architecture Overview

### Core Components

**Main Entry Point (`index.js`)**
- Central configuration and initialization
- Keyboard UI for runtime control (q=quit, a=toggle autojoin, j=join meeting, etc.)
- Auto-join logic with configurable time windows
- Module loading system for both `mod_*` directories and `modules/*_core.js` files

**Web Server (`server.js`)**  
- HTTP server serving static files from `/public`
- WebSocket server for real-time communication
- Authentication via Cloudflare Access headers or local IP ranges
- Route registration system for modules
- Message broadcasting to all connected WebSocket clients

**OSC Manager (`OSCmanager.js`)**
- Handles OSC (Open Sound Control) communication with Zoom
- Manages bidirectional OSC messages for Zoom meeting control
- Event-driven architecture with passthrough capability

### Module System

**Core Modules** (`modules/mod_*_core.js`)
- `mod_auth_core.js` - Authentication and credentials management
- `mod_bouncer_core.js` - Access control functionality  
- `mod_mgr_core.js` - Meeting management features
- `mod_lwt_core.js` - Lightweight client functionality
- `mod_mview_core.js` - Meeting view components
- `mod_jump_core.js` - Quick meeting join features

**Application Modules** (`mod_*/mod_*.js`)
- Self-contained feature modules loaded automatically at startup
- Each module can register routes and handle specific functionality

### Configuration

Configuration loaded from `../appauth/config.json` with structure:
- OSC server settings (IP, ports)
- Zoom meeting credentials (ID, password, ZAK tokens)
- Device settings (camera, mic, speaker)
- Auto-join and passthrough settings

### Authentication

Multi-tier authentication system:
1. Cloudflare Access (cf-access-authenticated-user-email header)
2. Local network access (192.168.x.x, ::1)
3. Unauthorized connections rejected

### Utilities

- `util_auth.js` - Authentication helpers
- `util_general.js` - General utility functions  
- `util_wsclient.js` - WebSocket client utilities
- `zoomauth.js` - Zoom API authentication
- `zoomfunc.js` - Zoom API function wrappers

## Key Features

- **Auto-Join Logic**: Automatically joins/leaves Zoom meetings based on configured time windows
- **Device Management**: Configures audio/video devices upon meeting join
- **Real-time Updates**: WebSocket broadcasts of meeting participant state changes
- **OSC Integration**: Full OSC control of Zoom meetings for external automation
- **Module Architecture**: Extensible via self-loading modules
- **Audio Hijack Integration**: Controls Audio Hijack sessions via AppleScript commands

## Module Development

For creating new modules or updating existing ones, see the comprehensive **MODULE_API.md** file which documents:
- Module loading system and structure requirements
- Available APIs (OSC, WebSocket, HTTP routes, authentication, etc.)
- Communication patterns and best practices
- Complete module template with examples
- Security guidelines and error handling patterns

When working with modules, always reference MODULE_API.md for the current API specifications and coding standards.

## Testing

No formal test framework detected. Manual testing via keyboard commands in main application.