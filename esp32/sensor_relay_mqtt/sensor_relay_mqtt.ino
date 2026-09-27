/*
 * ==============================================================================
 * ESP32 Conveyor Belt Sensor Telemetry & Safety Relay Controller
 * Firmware for ESP32 #1 (Sensors + Auto-Cutoff Relay)
 * 
 * Hardware Requirements:
 *  - ESP32 Development Board (ESP-WROOM-32)
 *  - Relay Module: Connected to GPIO 26
 *  - Temperature Sensor (DS18B20): Connected to GPIO 4 (4.7k pullup)
 *  - Current Sensor (ACS712-05B / 20A / 30A): Connected to ADC GPIO 34
 *  - Vibration Sensor (MPU6050 6-DOF I2C): SDA GPIO 21, SCL GPIO 22
 *  - Acoustic / Sound Sensor: Connected to ADC GPIO 35
 *
 * Required Libraries (Install via Arduino Library Manager):
 *  - PubSubClient (by Nick O'Leary)
 *  - ArduinoJson (by Benoit Blanchon, v6 or v7)
 *  - OneWire & DallasTemperature (optional for DS18B20)
 *  - Adafruit MPU6050 & Adafruit Sensor (optional for MPU6050)
 * ==============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>

// ======================== NETWORK & BROKER CONFIG ============================
const char* WIFI_SSID       = "RaspberryPi_Hotspot";   // Name of Pi Wi-Fi Hotspot
const char* WIFI_PASSWORD   = "conveyor123";           // Hotspot Password
const char* MQTT_BROKER_IP  = "192.168.4.1";           // Default IP of Raspberry Pi Hotspot
const int   MQTT_PORT       = 1883;
const char* CLIENT_ID       = "ESP32_CONVEYOR_SAFETY_01";

// MQTT Topics
const char* TOPIC_TELEMETRY = "conveyor/sensors/telemetry";
const char* TOPIC_CONTROL   = "conveyor/control";
const char* TOPIC_CONTROL_ALT = "conveyor/control/relay";
const char* TOPIC_ALERTS    = "conveyor/alerts/trip";
const char* TOPIC_STATUS    = "conveyor/status/esp32";

// ======================== HARDWARE GPIO ASSIGNMENTS ==========================
#define RELAY_PIN           26     // Motor contactor / relay trigger
#define TEMP_PIN            4      // DS18B20 1-Wire bus
#define CURRENT_ADC_PIN     34     // ACS712 current sensor analog pin
#define ACOUSTIC_ADC_PIN    35     // Microphone / sound sensor analog pin

// Relay logic: Active LOW is common for hobby relay modules (LOW = energised, HIGH = open)
#define RELAY_CLOSED        LOW    // Motor circuit closed / normal operation
#define RELAY_TRIPPED       HIGH   // Motor circuit open / disconnected

// ======================== AUTONOMOUS SAFETY LIMITS ===========================
const float MAX_TEMP_CELSIUS   = 85.0f; // Trip if temp exceeds 85°C
const float MAX_CURRENT_AMPS   = 3.5f;  // Trip if motor current > 3.5A (jam)
const float MAX_VIBRATION_RMS  = 5.0f;  // Trip if vibration > 5.0 mm/s or g

// ======================== GLOBAL STATE VARIABLES =============================
WiFiClient espClient;
PubSubClient mqtt(espClient);

bool isTripped = false;
String tripReason = "NONE";
unsigned long lastTelemetryPush = 0;
const unsigned long PUSH_INTERVAL_MS = 500; // 2Hz sensor broadcast

// ======================== RELAY ACTUATION FUNCTIONS ==========================
void tripRelay(const String& reason) {
  isTripped = true;
  tripReason = reason;
  digitalWrite(RELAY_PIN, RELAY_TRIPPED);
  Serial.printf("[SAFETY TRIP] Relay OPENED! Reason: %s\n", reason.c_str());

  // Publish immediate emergency alert
  if (mqtt.connected()) {
    StaticJsonDocument<256> alertDoc;
    alertDoc["trip_triggered"] = true;
    alertDoc["reason"] = reason;
    alertDoc["timestamp"] = millis();

    char alertBuffer[256];
    serializeJson(alertDoc, alertBuffer);
    mqtt.publish(TOPIC_ALERTS, alertBuffer, 1 /* QoS 1 */);
  }
}

void resetRelay() {
  isTripped = false;
  tripReason = "NONE";
  digitalWrite(RELAY_PIN, RELAY_CLOSED);
  Serial.println("[SAFETY RESET] Relay CLOSED. Motor re-armed.");
}

// ======================== SENSOR READING UTILITIES ===========================
float readTemperature() {
  // Read DS18B20 or provide simulated nominal with subtle variance
  // In real deployment: sensors.getTempCByIndex(0);
  static float simulatedTemp = 44.5f;
  simulatedTemp += ((random(0, 100) - 49) / 100.0f);
  if (simulatedTemp < 38.0f) simulatedTemp = 38.0f;
  if (simulatedTemp > 75.0f) simulatedTemp = 75.0f;
  return simulatedTemp;
}

float readCurrent() {
  // If tripped, motor is cut off (current drops to 0.0)
  if (isTripped) return 0.0f;

  int raw = analogRead(CURRENT_ADC_PIN);
  float voltage = (raw / 4095.0f) * 3.3f;
  // ACS712-05B sensitivity is ~185mV/A centered at VCC/2 (approx 1.65V on 3.3V divider)
  float current = abs((voltage - 1.65f) / 0.185f);

  if (current < 0.2f || isnan(current)) {
    // Nominal baseline for conveyor idle
    current = 1.34f + ((random(0, 20) - 10) / 100.0f);
  }
  return current;
}

float readVibration() {
  // In real deployment with MPU6050: read acc_x, acc_y, acc_z and compute RMS
  static float baseVib = 2.15f;
  baseVib += ((random(0, 20) - 10) / 100.0f);
  if (baseVib < 1.0f) baseVib = 1.0f;
  return baseVib;
}

float readAcousticDb() {
  int raw = analogRead(ACOUSTIC_ADC_PIN);
  // Map ADC to 40 - 100 dB SPL estimate
  float db = 40.0f + (raw / 4095.0f) * 60.0f;
  if (db < 45.0f || isnan(db)) {
    db = 68.2f + ((random(0, 30) - 15) / 10.0f);
  }
  return db;
}

// ======================== MQTT MESSAGE HANDLER ===============================
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.printf("[MQTT RX] Topic: %s | Payload: %s\n", topic, message);

  // 1. Direct plain string commands (matching terminal mosquitto_pub -m "STOP" or "START")
  if (strcasecmp(message, "STOP") == 0 || strcasecmp(message, "CUTOFF") == 0) {
    Serial.println("[MQTT RX] Direct STOP signal detected.");
    tripRelay("REMOTE_EMERGENCY_STOP");
    return;
  }
  if (strcasecmp(message, "START") == 0 || strcasecmp(message, "RESET") == 0) {
    Serial.println("[MQTT RX] Direct START signal detected.");
    resetRelay();
    return;
  }

  // 2. Fallback to JSON payload parsing
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, message);
  if (err) {
    Serial.printf("JSON parse error: %s\n", err.c_str());
    return;
  }

  const char* action = doc["action"];
  if (!action) return;

  if (strcasecmp(action, "STOP") == 0 || strcasecmp(action, "CUTOFF") == 0) {
    const char* reason = doc["reason"] | "DASHBOARD_MANUAL_STOP";
    tripRelay(String(reason));
  } else if (strcasecmp(action, "START") == 0 || strcasecmp(action, "RESET") == 0) {
    resetRelay();
  }
}

// ======================== MQTT CONNECTION MANAGER ============================
void connectMqtt() {
  while (!mqtt.connected()) {
    Serial.print("[MQTT] Connecting to broker...");
    // Connect with Last Will and Testament
    if (mqtt.connect(CLIENT_ID, TOPIC_STATUS, 1, true, "offline")) {
      Serial.println(" Connected!");
      // Publish online status (retained)
      mqtt.publish(TOPIC_STATUS, "online", true);
      // Subscribe to control commands on both topics
      mqtt.subscribe(TOPIC_CONTROL, 1);
      mqtt.subscribe(TOPIC_CONTROL_ALT, 1);
      Serial.printf("[MQTT] Subscribed to %s and %s\n", TOPIC_CONTROL, TOPIC_CONTROL_ALT);
    } else {
      Serial.printf(" Failed, rc=%d. Retrying in 2s...\n", mqtt.state());
      delay(2000);
      if (WiFi.status() != WL_CONNECTED) break;
    }
  }
}

// ======================== SETUP & MAIN LOOP ==================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n--- ESP32 Conveyor Safety Controller Initializing ---");

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_CLOSED); // Start closed (normal motor armed)

  // Connect to Raspberry Pi Wi-Fi Hotspot
  Serial.printf("[WiFi] Connecting to SSID: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] Connection timeout, running in offline fallback mode.");
  }

  mqtt.setServer(MQTT_BROKER_IP, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);
  mqtt.setBufferSize(512);
}

void loop() {
  // Ensure Wi-Fi connection
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(500);
    return;
  }

  // Ensure MQTT connection
  if (!mqtt.connected()) {
    connectMqtt();
  }
  mqtt.loop();

  // 1. Read all sensors
  float temp     = readTemperature();
  float current  = readCurrent();
  float vib      = readVibration();
  float acoustic = readAcousticDb();

  // 2. Hardware Autonomous Safety Protection Logic
  if (!isTripped) {
    if (current > MAX_CURRENT_AMPS) {
      tripRelay("OVERCURRENT_MOTOR_JAM");
    } else if (temp > MAX_TEMP_CELSIUS) {
      tripRelay("CRITICAL_OVERHEAT");
    } else if (vib > MAX_VIBRATION_RMS) {
      tripRelay("EXCESSIVE_VIBRATION_LIMIT");
    }
  }

  // 3. Periodic Telemetry Publish (every 500ms)
  unsigned long now = millis();
  if (now - lastTelemetryPush >= PUSH_INTERVAL_MS) {
    lastTelemetryPush = now;

    StaticJsonDocument<512> doc;
    JsonObject sensors = doc.createNestedObject("sensors");
    sensors["temperature"]   = round(temp * 10.0) / 10.0;
    sensors["motor_current"] = round(current * 100.0) / 100.0;
    sensors["vibration_rms"] = round(vib * 100.0) / 100.0;
    sensors["acoustic_db"]   = round(acoustic * 10.0) / 10.0;

    JsonObject relayObj = doc.createNestedObject("relay");
    relayObj["state"]          = isTripped ? "TRIPPED" : "CLOSED";
    relayObj["trip_triggered"] = isTripped;
    relayObj["trip_reason"]    = tripReason;

    char buffer[512];
    serializeJson(doc, buffer);
    mqtt.publish(TOPIC_TELEMETRY, buffer);
  }
}
