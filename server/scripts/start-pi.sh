#!/bin/bash
# ==============================================================================
# start-pi.sh
# Production launch script for Raspberry Pi IoT Dashboard
# Usage: bash server/scripts/start-pi.sh
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

# Ensure client bundle is built
if [ ! -f "$ROOT_DIR/client/dist/index.html" ]; then
  echo "Client build not found. Building now..."
  cd "$ROOT_DIR/client" && npm run build
fi

cd "$ROOT_DIR/server"

# Set production environment
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=3001

echo "Starting IoT Control Room Server..."
node index.js
