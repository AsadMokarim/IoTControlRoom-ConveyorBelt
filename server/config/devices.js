/**
 * devices.js
 * Hardware endpoints, MQTT topics, and camera configurations.
 * Configurable via environment variables.
 */

import os from 'os';

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
      TELEMETRY: 'conveyor/sensors',
      TELEMETRY_LEGACY: 'conveyor/sensors/telemetry',
      ALL_CONVEYOR: 'conveyor/#',
      CONTROL_RELAY: 'conveyor/control/relay',
      ALERTS_TRIP: 'conveyor/alerts/trip',
      STATUS_ESP32: 'conveyor/status/esp32',
    },
  },
  CAMERAS: [
    {
      id: 'cam_1',
      label: 'Belt Overview (Main Drive)',
      ip: process.env.CAM1_IP || '192.168.4.3',
      port: process.env.CAM1_PORT || 81,
      streamPath: '/stream',
    },
    {
      id: 'cam_2',
      label: 'Splice Joint Inspection',
      ip: process.env.CAM2_IP || '192.168.4.4',
      port: process.env.CAM2_PORT || 81,
      streamPath: '/stream',
    },
  ],
};
