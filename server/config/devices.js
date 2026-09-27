/**
 * devices.js
 * Hardware endpoints, MQTT topics, and camera configurations.
 * Configurable via environment variables.
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load .env file from server/ or project root
const envFiles = [
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    try {
      const content = fs.readFileSync(envFile, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
      console.log(`[Config] Loaded environment variables from ${envFile}`);
    } catch (_) {}
    break;
  }
}

function detectBrokerUrl() {
  if (process.env.MQTT_BROKER_URL) return process.env.MQTT_BROKER_URL;
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.address === '10.42.0.1') {
          return 'mqtt://10.42.0.1:1883';
        }
      }
    }
  } catch (_) {}
  return 'mqtt://10.42.0.1:1883';
}

export const DEVICES = {
  MQTT: {
    BROKER_URL: detectBrokerUrl(),
    FALLBACK_URL: 'mqtt://127.0.0.1:1883',
    TOPICS: {
      CONTROL: process.env.MQTT_CONTROL_TOPIC || 'conveyor/control',
      CONTROL_RELAY: 'conveyor/control/relay',
      TELEMETRY: 'conveyor/sensors',
      TELEMETRY_LEGACY: 'conveyor/sensors/telemetry',
      ALL_CONVEYOR: 'conveyor/#',
      ALERTS_TRIP: 'conveyor/alerts/trip',
      STATUS_ESP32: 'conveyor/status/esp32',
    },
  },
  CAMERAS: [
    {
      id: 'cam_1',
      label: 'Belt Overview (Main Drive)',
      ip: process.env.CAM1_IP || '10.42.0.118',
      port: Number(process.env.CAM1_PORT) || 81,
      streamPath: '/stream',
      proxyUrl: '/api/stream',
    },
    {
      id: 'cam_2',
      label: 'Splice Joint Inspection',
      ip: process.env.CAM2_IP || '10.42.0.119',
      port: Number(process.env.CAM2_PORT) || 81,
      streamPath: '/stream',
    },
  ],
};
