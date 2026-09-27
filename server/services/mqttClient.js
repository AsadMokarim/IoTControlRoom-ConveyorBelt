/**
 * mqttClient.js
 * MQTT client service connecting Node.js to Mosquitto broker.
 * Ingests telemetry and alert topics, and publishes relay commands.
 */

import mqtt from 'mqtt';
import { DEVICES } from '../config/devices.js';
import telemetryStore from './telemetryStore.js';

class MqttService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.esp32Online = false;
    this.brokerUrl = null;
    this.messagesReceived = 0;
    this.lastMessageAt = null;
    this.lastTopic = null;
  }

  init() {
    const candidates = [
      process.env.MQTT_BROKER_URL,
      DEVICES.MQTT.BROKER_URL,
      'mqtt://10.42.0.1:1883',
      'mqtt://127.0.0.1:1883',
      'mqtt://localhost:1883',
    ].filter(Boolean);
    const brokerUrls = [...new Set(candidates)];

    const tryNext = (idx) => {
      if (idx >= brokerUrls.length) {
        console.warn('[MQTT] All candidate brokers exhausted. Retrying sequence in 5s...');
        setTimeout(() => tryNext(0), 5000);
        return;
      }

      const url = brokerUrls[idx];
      this.brokerUrl = url;
      console.log(`[MQTT] Connecting to broker at ${url} (candidate ${idx + 1}/${brokerUrls.length})...`);

      const client = mqtt.connect(url, {
        reconnectPeriod: 2500,
        connectTimeout: 3000,
        clientId: `iot_dashboard_server_${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
      });

      let hasConnected = false;
      const timeoutTimer = setTimeout(() => {
        if (!hasConnected) {
          console.warn(`[MQTT] Timeout connecting to ${url}, attempting next candidate...`);
          try { client.end(true); } catch (_) {}
          tryNext(idx + 1);
        }
      }, 3500);

      client.on('connect', () => {
        hasConnected = true;
        clearTimeout(timeoutTimer);
        this.client = client;
        this.isConnected = true;
        console.log(`[MQTT] ✅ Connected successfully to Mosquitto broker: ${url}`);

        // Subscribe to wildcard conveyor/# plus specific telemetry and control topics
        const topics = [
          'conveyor/#',
          DEVICES.MQTT.TOPICS.CONTROL,
          DEVICES.MQTT.TOPICS.CONTROL_RELAY,
          DEVICES.MQTT.TOPICS.TELEMETRY,
          DEVICES.MQTT.TOPICS.TELEMETRY_LEGACY,
          DEVICES.MQTT.TOPICS.ALERTS_TRIP,
          DEVICES.MQTT.TOPICS.STATUS_ESP32,
        ].filter(Boolean);

        client.subscribe(topics, (err) => {
          if (err) {
            console.error('[MQTT] Subscription error:', err);
          } else {
            console.log(`[MQTT] ✅ Subscribed to topics: ${[...new Set(topics)].join(', ')}`);
          }
        });
      });

      client.on('message', (topic, message) => {
        this.messagesReceived++;
        this.lastMessageAt = new Date().toISOString();
        this.lastTopic = topic;
        this.handleMessage(topic, message.toString());
      });

      client.on('offline', () => {
        this.isConnected = false;
        console.warn(`[MQTT] Broker at ${url} went offline. Auto-reconnecting...`);
      });

      client.on('error', (err) => {
        this.isConnected = false;
        if (!hasConnected) {
          clearTimeout(timeoutTimer);
          console.warn(`[MQTT] Connection failed at ${url} (${err.message}). Trying next...`);
          try { client.end(true); } catch (_) {}
          tryNext(idx + 1);
        } else {
          console.warn(`[MQTT] Broker runtime error (${url}): ${err.message}`);
        }
      });
    };

    tryNext(0);
  }

  handleMessage(topic, rawPayload) {
    try {
      const rawText = typeof rawPayload === 'string' ? rawPayload.trim() : String(rawPayload).trim();
      const upper = rawText.toUpperCase();

      // 1. Control commands received via MQTT (e.g., mosquitto_pub -t "conveyor/control" -m "STOP" or "START")
      const isControlTopic =
        topic === DEVICES.MQTT.TOPICS.CONTROL ||
        topic === 'conveyor/control' ||
        topic === DEVICES.MQTT.TOPICS.CONTROL_RELAY ||
        topic === 'conveyor/control/relay' ||
        topic.endsWith('/control');

      if (isControlTopic) {
        let action = upper;
        let reason = 'MQTT_EXTERNAL_SIGNAL';

        if (rawText.startsWith('{')) {
          try {
            const parsed = JSON.parse(rawText);
            if (parsed.action) action = String(parsed.action).toUpperCase();
            if (parsed.reason) reason = parsed.reason;
          } catch (_) {}
        }

        if (action === 'STOP' || action === 'CUTOFF') {
          console.warn(`[MQTT RX] 🛑 Emergency STOP received on "${topic}" (${reason})`);
          telemetryStore.setRelayState({
            state: 'TRIPPED',
            trip_triggered: true,
            trip_reason: reason === 'MQTT_EXTERNAL_SIGNAL' ? 'EMERGENCY_STOP' : reason,
          });
          return;
        } else if (action === 'START' || action === 'RESET') {
          console.log(`[MQTT RX] 🔄 START / RESET received on "${topic}"`);
          telemetryStore.setRelayState({
            state: 'CLOSED',
            trip_triggered: false,
            trip_reason: 'NONE',
          });
          return;
        }
      }

      // 2. Ingest sensor telemetry from conveyor/sensors, conveyor/sensors/telemetry, or any conveyor/sensors/*
      if (
        topic === 'conveyor/sensors' ||
        topic === 'conveyor/sensors/telemetry' ||
        topic.startsWith('conveyor/sensors') ||
        topic === 'conveyor'
      ) {
        // Sanitize non-standard JSON literals (e.g., nan, -nan, +nan, NaN, infinity emitted by microcontrollers)
        const cleanedPayload = typeof rawPayload === 'string'
          ? rawPayload.replace(/([:,\[]\s*)[-+]?(?:nan|infinity|inf)\b/gi, '$1null')
          : rawPayload;
        const data = JSON.parse(cleanedPayload);
        console.log(`[MQTT INGEST] [${topic}] temp=${data.temp ?? data.temperature ?? '--'} current=${data.current ?? data.motor_current ?? '--'} shock=${data.shock ?? data.vibration ?? '--'}`);
        telemetryStore.updateFromDevice(data);
      } else if (topic.includes('alerts') || topic.includes('trip')) {
        const cleanedPayload = typeof rawPayload === 'string'
          ? rawPayload.replace(/([:,\[]\s*)[-+]?(?:nan|infinity|inf)\b/gi, '$1null')
          : rawPayload;
        const tripData = JSON.parse(cleanedPayload);
        console.warn('[MQTT ALERT] Hardware trip received:', tripData);
        telemetryStore.setRelayState({
          state: 'TRIPPED',
          trip_triggered: true,
          trip_reason: tripData.reason || 'HARDWARE_AUTOCUTOFF',
        });
      } else if (topic.includes('status')) {
        const status = rawPayload.trim();
        this.esp32Online = status.toLowerCase() === 'online' || status.toLowerCase() === 'ok';
        console.log(`[MQTT] ESP32 device status: ${status}`);
      }
    } catch (e) {
      console.error(`[MQTT] Failed to parse message on ${topic}:`, e.message);
    }
  }

  /**
   * Publish control command (STOP / START) to conveyor/control.
   * Matches terminal commands:
   *   mosquitto_pub -h 10.42.0.1 -t "conveyor/control" -m "STOP"
   *   mosquitto_pub -h 10.42.0.1 -t "conveyor/control" -m "START"
   */
  publishControlCommand(action, reason = 'OPERATOR_ACTION') {
    return new Promise((resolve, reject) => {
      const actUpper = String(action).toUpperCase();
      const normalizedSignal = (actUpper === 'CUTOFF' || actUpper === 'STOP') ? 'STOP' : 'START';
      const controlTopic = DEVICES.MQTT.TOPICS.CONTROL || 'conveyor/control';
      const relayTopic = DEVICES.MQTT.TOPICS.CONTROL_RELAY || 'conveyor/control/relay';

      const jsonPayload = JSON.stringify({
        action: normalizedSignal,
        reason,
        timestamp: new Date().toISOString(),
      });

      if (!this.client || !this.isConnected) {
        console.warn(`[MQTT] Cannot publish ${normalizedSignal} command: broker not connected. Updating local state.`);
        return resolve({
          published: false,
          queued: false,
          reason: 'BROKER_OFFLINE',
          signal: normalizedSignal,
          topic: controlTopic,
        });
      }

      // 1. Publish plain string ("STOP" or "START") to primary conveyor/control topic
      this.client.publish(
        controlTopic,
        normalizedSignal,
        { qos: 1 },
        (err) => {
          if (err) {
            console.error(`[MQTT] Error publishing ${normalizedSignal} to ${controlTopic}:`, err);
            return reject(err);
          }

          console.log(`[MQTT] ✅ Published "${normalizedSignal}" to topic "${controlTopic}"`);

          // 2. Also publish to relay topic if distinct, both as plain string & JSON for hardware compatibility
          if (relayTopic && relayTopic !== controlTopic) {
            this.client.publish(relayTopic, normalizedSignal, { qos: 1 });
            this.client.publish(relayTopic, jsonPayload, { qos: 1 });
          }

          resolve({
            published: true,
            topic: controlTopic,
            signal: normalizedSignal,
            reason,
          });
        }
      );
    });
  }

  /**
   * Backward-compatible alias for publishControlCommand
   */
  publishRelayCommand(action, reason = 'OPERATOR_ACTION') {
    return this.publishControlCommand(action, reason);
  }
}

export default new MqttService();
