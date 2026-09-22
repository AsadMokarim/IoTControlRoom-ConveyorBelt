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
    const brokerUrl = DEVICES.MQTT.BROKER_URL;
    console.log(`[MQTT] Connecting to broker at ${brokerUrl}...`);

    try {
      this.client = mqtt.connect(brokerUrl, {
        reconnectPeriod: 3000,
        connectTimeout: 5000,
        clientId: `iot_dashboard_server_${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log(`[MQTT] Successfully connected to broker: ${brokerUrl}`);

        const topics = [
          DEVICES.MQTT.TOPICS.TELEMETRY,
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
        // Don't crash server if broker is temporarily down during local dev
        console.warn(`[MQTT] Broker warning: ${err.message}`);
      });
    } catch (error) {
      console.error('[MQTT] Initialization error:', error.message);
    }
  }

  handleMessage(topic, rawPayload) {
    try {
      if (topic === DEVICES.MQTT.TOPICS.TELEMETRY) {
        const data = JSON.parse(rawPayload);
        telemetryStore.updateFromDevice(data);
      } else if (topic === DEVICES.MQTT.TOPICS.ALERTS_TRIP) {
        const tripData = JSON.parse(rawPayload);
        console.warn('[MQTT ALERT] Hardware trip received:', tripData);
        telemetryStore.setRelayState({
          state: 'TRIPPED',
          trip_triggered: true,
          trip_reason: tripData.reason || 'HARDWARE_AUTOCUTOFF',
        });
      } else if (topic === DEVICES.MQTT.TOPICS.STATUS_ESP32) {
        const status = rawPayload.trim();
        this.esp32Online = status === 'online';
        console.log(`[MQTT] ESP32 device status changed to: ${status}`);
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
