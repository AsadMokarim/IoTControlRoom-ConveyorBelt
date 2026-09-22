import { Router } from 'express';
import mqttClient from '../services/mqttClient.js';
import telemetryStore from '../services/telemetryStore.js';
import { DEVICES } from '../config/devices.js';

const router = Router();

// Trigger emergency cutoff
router.post('/cutoff', async (req, res) => {
  try {
    const { reason = 'MANUAL_STOP' } = req.body || {};

    // 1. Update local state immediately
    telemetryStore.setRelayState({
      state: 'TRIPPED',
      trip_triggered: true,
      trip_reason: reason,
    });

    // 2. Publish to MQTT for ESP32 hardware relay
    const mqttResult = await mqttClient.publishRelayCommand('CUTOFF', reason);

    res.json({
      ok: true,
      relay_state: 'TRIPPED',
      trip_reason: reason,
      mqtt: mqttResult,
    });
  } catch (err) {
    console.error('Error triggering cutoff:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Reset relay / resume motor
router.post('/reset', async (req, res) => {
  try {
    // 1. Update local state
    telemetryStore.setRelayState({
      state: 'CLOSED',
      trip_triggered: false,
      trip_reason: 'NONE',
    });

    // 2. Publish to MQTT for ESP32
    const mqttResult = await mqttClient.publishRelayCommand('RESET', 'OPERATOR_RESET');

    res.json({
      ok: true,
      relay_state: 'CLOSED',
      mqtt: mqttResult,
    });
  } catch (err) {
    console.error('Error triggering reset:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

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

export default router;
