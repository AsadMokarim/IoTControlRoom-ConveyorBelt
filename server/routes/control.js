import { Router } from 'express';
import mqttClient from '../services/mqttClient.js';
import telemetryStore from '../services/telemetryStore.js';
import { DEVICES } from '../config/devices.js';

const router = Router();

// Handler for Emergency Stop (/cutoff and /stop)
const handleStop = async (req, res) => {
  try {
    const { reason = 'MANUAL_STOP' } = req.body || {};

    // 1. Update local state immediately
    telemetryStore.setRelayState({
      state: 'TRIPPED',
      trip_triggered: true,
      trip_reason: reason,
    });

    // 2. Publish "STOP" to conveyor/control MQTT
    const mqttResult = await mqttClient.publishControlCommand('STOP', reason);

    res.json({
      ok: true,
      action: 'STOP',
      relay_state: 'TRIPPED',
      trip_reason: reason,
      mqtt: mqttResult,
    });
  } catch (err) {
    console.error('Error triggering emergency stop:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

router.post('/cutoff', handleStop);
router.post('/stop', handleStop);

// Handler for Reset & Start (/reset and /start)
const handleStart = async (req, res) => {
  try {
    // 1. Update local state
    telemetryStore.setRelayState({
      state: 'CLOSED',
      trip_triggered: false,
      trip_reason: 'NONE',
    });

    // 2. Publish "START" to conveyor/control MQTT
    const mqttResult = await mqttClient.publishControlCommand('START', 'OPERATOR_RESET');

    res.json({
      ok: true,
      action: 'START',
      relay_state: 'CLOSED',
      mqtt: mqttResult,
    });
  } catch (err) {
    console.error('Error triggering start/reset:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

router.post('/reset', handleStart);
router.post('/start', handleStart);

// Get current relay & control status
router.get('/status', (req, res) => {
  res.json({
    ok: true,
    relay: telemetryStore.getRelayState(),
    mqttConnected: mqttClient.isConnected,
    mqttBroker: mqttClient.brokerUrl,
    messagesReceived: mqttClient.messagesReceived,
    lastMessageAt: mqttClient.lastMessageAt,
    lastTopic: mqttClient.lastTopic,
    esp32Online: mqttClient.esp32Online,
  });
});

// Expose camera and device config to frontend
router.get('/devices', (req, res) => {
  res.json({
    ok: true,
    cameras: DEVICES.CAMERAS,
  });
});

// Update camera IP/port dynamically from frontend
router.post('/devices/camera', (req, res) => {
  try {
    const { id, ip, port } = req.body || {};
    const cam = DEVICES.CAMERAS.find((c) => c.id === id);
    if (!cam) {
      return res.status(404).json({ ok: false, error: `Camera ${id} not found` });
    }
    if (ip) cam.ip = String(ip).trim();
    if (port) cam.port = Number(port);
    console.log(`[Camera] Updated ${id} endpoint to ${cam.ip}:${cam.port}`);
    res.json({ ok: true, camera: cam, cameras: DEVICES.CAMERAS });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
