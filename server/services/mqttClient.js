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
  }

  init() {
    const candidates = [
      process.env.MQTT_BROKER_URL,
      DEVICES.MQTT.BROKER_URL,
      DEVICES.MQTT.FALLBACK_URL,
      'mqtt://127.0.0.1:1883',
      'mqtt://10.42.0.1:1883',
      'mqtt://localhost:1883',
    ].filter(Boolean);
    const brokerUrls = [...new Set(candidates)];
    let currentIdx = 0;

    const connectToBroker = (url) => {
      console.log(`[MQTT] Attempting connection to broker at ${url}...`);

      try {
        if (this.client) {
          try { this.client.end(true); } catch (_) {}
        }

        this.client = mqtt.connect(url, {
          reconnectPeriod: 3000,
          connectTimeout: 4000,
          clientId: `iot_dashboard_server_${Math.random().toString(16).slice(2, 8)}`,
          clean: true,
        });

        let connectionEstablished = false;

        this.client.on('connect', () => {
          this.isConnected = true;
          connectionEstablished = true;
          console.log(`[MQTT] Successfully connected to broker: ${url}`);

          // Subscribe to wildcard conveyor/# plus specific telemetry topics
          const topics = [
            'conveyor/#',
            DEVICES.MQTT.TOPICS.TELEMETRY,
            DEVICES.MQTT.TOPICS.TELEMETRY_LEGACY,
            DEVICES.MQTT.TOPICS.ALERTS_TRIP,
            DEVICES.MQTT.TOPICS.STATUS_ESP32,
          ];

          this.client.subscribe(topics, (err) => {
            if (err) {
              console.error('[MQTT] Subscription error:', err);
            } else {
              console.log(`[MQTT] Subscribed to topics: ${topics.join(', ')}`);
            }
          });
        });

        this.client.on('message', (topic, message) => {
          this.handleMessage(topic, message.toString());
        });

        this.client.on('offline', () => {
          this.isConnected = false;
          console.warn('[MQTT] Broker connection went offline. Reconnecting in background...');
        });

        this.client.on('error', (err) => {
          this.isConnected = false;
          console.warn(`[MQTT] Broker warning (${url}): ${err.message}`);

          // If never successfully connected to this URL, try the next candidate broker
          if (!connectionEstablished && currentIdx < brokerUrls.length - 1) {
            currentIdx++;
            const nextUrl = brokerUrls[currentIdx];
            console.log(`[MQTT] Trying next candidate broker URL: ${nextUrl}`);
            connectToBroker(nextUrl);
          }
        });
      } catch (error) {
        console.error('[MQTT] Initialization error:', error.message);
      }
    };

    connectToBroker(brokerUrls[0]);
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
