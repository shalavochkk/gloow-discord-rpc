#!/bin/bash
HOST_NAME="com.gloowroom.discordrpc"
BRIDGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../bridge" && pwd)"
START_SCRIPT="$BRIDGE_DIR/start.sh"
cat > "$START_SCRIPT" << 'SCRIPT'
#!/bin/bash
node "$(dirname "$0")/index.js"
SCRIPT
chmod +x "$START_SCRIPT"
cat > "$BRIDGE_DIR/${HOST_NAME}.json" << EOF
{"name":"$HOST_NAME","description":"Gloowroom Discord RPC Native Host","path":"$START_SCRIPT","type":"stdio","allowed_origins":["chrome-extension://EXTENSION_ID/"]}
