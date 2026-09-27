#!/bin/bash
# ==============================================================================
# install-pi.sh
# Run this once on the Raspberry Pi to set up Mosquitto and build the project.
# Usage: bash server/scripts/install-pi.sh
# ==============================================================================

set -e

echo ">>> [1/5] Updating package lists..."
sudo apt update -y

echo ">>> [2/5] Installing Mosquitto MQTT broker..."
sudo apt install -y mosquitto mosquitto-clients

echo ">>> [3/5] Configuring Mosquitto for Hotspot Subnet..."
# Allow unauthenticated local connections on the private hotspot network
sudo tee /etc/mosquitto/conf.d/iot-control.conf > /dev/null <<EOF
listener 1883 0.0.0.0
allow_anonymous true
EOF

echo ">>> Restarting Mosquitto service..."
sudo systemctl enable mosquitto
sudo systemctl restart mosquitto

echo ">>> [4/5] Installing project dependencies..."
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

cd "$ROOT_DIR/server"
npm install

cd "$ROOT_DIR/client"
npm install

echo ">>> [5/5] Building production React dashboard..."
npm run build

echo "=============================================================================="
echo " Setup complete! Mosquitto MQTT broker is active."
echo " To start the IoT Control Room server, run:"
echo "   bash server/scripts/start-pi.sh"
echo "=============================================================================="
