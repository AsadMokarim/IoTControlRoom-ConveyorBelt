import mqtt from 'mqtt';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

let client = null;
let isConnected = false;

/**
 * Initialize the MQTT client and connect to the broker.
 * Safe to call multiple times — will not reconnect if already connected.
 */
export function connectMqtt() {
  if (client) return client;

  console.log(`[MQTT] Connecting to broker at ${BROKER_URL}...`);

  client = mqtt.connect(BROKER_URL, {
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  });

  client.on('connect', () => {
    isConnected = true;
    console.log('[MQTT] Connected to broker');
  });

  client.on('error', (err) => {
    console.error('[MQTT] Connection error:', err.message);
  });

  client.on('close', () => {
    isConnected = false;
    console.log('[MQTT] Disconnected from broker');
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Reconnecting...');
  });

  client.on('offline', () => {
    isConnected = false;
    console.log('[MQTT] Client offline');
  });

  return client;
}

/**
 * Publish a message to a topic.
 * @param {string} topic
 * @param {string} payload - Plain text payload
 * @param {object} [options] - MQTT publish options
 * @returns {Promise<void>}
 */
export function publishMessage(topic, payload, options = { qos: 1 }) {
  return new Promise((resolve, reject) => {
    if (!client || !isConnected) {
      return reject(new Error('MQTT client is not connected'));
    }

    client.publish(topic, payload, options, (err) => {
      if (err) {
        console.error(`[MQTT] Publish error on topic "${topic}":`, err.message);
        return reject(err);
      }
      console.log(`[MQTT] Published to "${topic}": ${payload}`);
      resolve();
    });
  });
}

/**
 * Check if the MQTT client is currently connected.
 * @returns {boolean}
 */
export function isMqttConnected() {
  return isConnected;
}
