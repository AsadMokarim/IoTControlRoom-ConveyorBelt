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

        // Subscribe to wildcard conveyor/# plus specific telemetry topics
        const topics = [
          'conveyor/#',
          DEVICES.MQTT.TOPICS.TELEMETRY,
          DEVICES.MQTT.TOPICS.TELEMETRY_LEGACY,
          DEVICES.MQTT.TOPICS.ALERTS_TRIP,
          DEVICES.MQTT.TOPICS.STATUS_ESP32,
        ];

        client.subscribe(topics, (err) => {
          if (err) {
            console.error('[MQTT] Subscription error:', err);
          } else {
            console.log(`[MQTT] ✅ Subscribed to topics: ${topics.join(', ')}`);
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
      // Ingest sensor telemetry from conveyor/sensors, conveyor/sensors/telemetry, or any conveyor/sensors/*
      if (
        topic === 'conveyor/sensors' ||
        topic === 'conveyor/sensors/telemetry' ||
        topic.startsWith('conveyor/sensors') ||
        topic === 'conveyor'
      ) {
        const data = JSON.parse(rawPayload);
        console.log(`[MQTT INGEST] [${topic}] temp=${data.temp ?? data.temperature ?? '--'} current=${data.current ?? data.motor_current ?? '--'} shock=${data.shock ?? data.vibration ?? '--'}`);
        telemetryStore.updateFromDevice(data);
      } else if (topic.includes('alerts') || topic.includes('trip')) {
        const tripData = JSON.parse(rawPayload);
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
   * Publish command to ESP32 relay (e.g., 'CUTOFF' or 'RESET')
   */
  publishRelayCommand(action, reason = 'OPERATOR_ACTION') {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        action,
        reason,
        timestamp: new Date().toISOString(),
      });

      if (!this.client || !this.isConnected) {
        console.warn(`[MQTT] Cannot publish ${action} command: broker not connected. Updating local state.`);
        return resolve({ published: false, queued: false, reason: 'BROKER_OFFLINE' });
      }

      this.client.publish(
        DEVICES.MQTT.TOPICS.CONTROL_RELAY,
        payload,
        { qos: 1 },
        (err) => {
          if (err) {
            console.error(`[MQTT] Error publishing ${action}:`, err);
            reject(err);
          } else {
            console.log(`[MQTT] Published ${action} to ${DEVICES.MQTT.TOPICS.CONTROL_RELAY}`);
            resolve({ published: true, payload });
          }
        }
      );
    });
  }
}

export default new MqttService();
