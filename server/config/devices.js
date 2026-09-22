/**
 * devices.js
 * Hardware endpoints, MQTT topics, and camera configurations.
 * Configurable via environment variables.
 */

export const DEVICES = {
  MQTT: {
    BROKER_URL: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    TOPICS: {
      TELEMETRY: 'conveyor/sensors/telemetry',
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
