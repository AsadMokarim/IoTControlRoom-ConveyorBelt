# 🏭 IoT Control Room — Conveyor Belt System with 3D Digital Twin

An industrial IoT SCADA monitoring dashboard and real-time 3D Digital Twin for industrial conveyor belts. Engineered for edge deployment on a **Raspberry Pi Wi-Fi Hotspot** with **ESP32 microcontroller telemetry**, **autonomous auto-cutoff relay protection**, and **ESP32-CAM video surveillance**.

---

## 📐 System Architecture

```text
  ┌────────────────────────────────────────────────────────┐
  │                 Raspberry Pi (Host / Gateway)          │
  │                  Hotspot IP: 10.42.0.1                 │
  │                                                        │
  │  ┌─────────────────────────┐  ┌─────────────────────┐  │
  │  │ Mosquitto MQTT Broker   │  │ Node.js Server      │  │
  │  │ Port 1883               │◄─┤ Express + WebSocket │  │
  │  └───────────▲─────────────┘  │ Port 3001           │  │
  └──────────────┼────────────────┴──────────▲──────────┴──┘
                 │ MQTT                      │ HTTP / WebSocket
                 │ (conveyor/#)              │ (Port 3001)
     ┌───────────┴──────────┐     ┌──────────┴──────────┐
     │                      │     │                     │
┌────┴─────────────────┐ ┌──┴─────┴──────────┐ ┌────────┴─────────────┐
│ ESP32 Sensor & Relay │ │ ESP32-CAM Node(s) │ │ Operator Laptop /    │
│ • Temperature        │ │ • Belt Overview   │ │ Control Room Browser │
│ • Current (ACS712)   │ │ • Splice Cam      │ │ • 3D Digital Twin    │
│ • Shock / Vibration  │ │ (HTTP MJPEG Stream│ │ • Real-Time Metrics  │
│ • Acoustic Sensor    │ │  Port 81/stream)  │ │ • E-Stop Controls    │
│ • Motor Cutoff Relay │ └───────────────────┘ └──────────────────────┘
└──────────────────────┘
```

---

## ✨ Features

- **🎮 Interactive 3D Digital Twin (Three.js)**:
  - Real-time animated conveyor belt reflecting live drive status, roller rotation, and belt speed.
  - Splice joint inspection tracking surface wear, temperature, vibration, splice gap, and tension.
  - Automatic emergency halt when hardware relay is tripped or failure simulated.

- **📡 Live Hardware MQTT Telemetry**:
  - Ingests real-time physical sensor data:
    - **Temperature**: Motor & bearing thermal monitoring (°C).
    - **Drive Current**: Real-time current draw in Amperes via ACS712 sensor.
    - **RMS Vibration & Shock**: Splice impact and mechanical wear monitoring.
    - **Acoustic Sensor**: Noise spike detection and SPL levels.
  - Seamless fallback to high-fidelity simulated telemetry when hardware is offline.

- **⚡ Hardware Auto-Cutoff & Emergency Stop**:
  - Independent hardware protection relay controlled autonomously or manually.
  - Web UI triggers `/api/control/cutoff` $\rightarrow$ publishes to MQTT `conveyor/control/relay` $\rightarrow$ ESP32 disconnects motor contactor.
  - Operator reset workflow to verify clearance before re-energizing the circuit.

- **📷 Multi-Camera ESP32-CAM Grid**:
  - Dedicated surveillance interface streaming live video from multiple ESP32-CAM nodes over Wi-Fi.
  - Live inspection of belt drive, discharge chute, and splice joint conditions.

- **🌓 Dark / Light Industrial SCADA Theme**:
  - High-contrast SCADA design compliant with industrial monitoring guidelines.

---

## 📂 Project Structure

```text
IoTControlRoom-ConveyorBelt/
├── client/                     # Frontend Application (React + Vite + Three.js)
│   ├── src/
│   │   ├── components/
│   │   │   ├── cameras/        # ESP32-CAM grid & stream cards
│   │   │   ├── dashboard/      # Gauges, acoustic meter, relay badge, E-stop
│   │   │   └── digital-twin/   # Three.js 3D canvas, scene, motor & joints
│   │   ├── hooks/              # useTelemetry (WS + HTTP fallback), useControl
│   │   └── App.jsx             # Main dashboard view & routing
│   └── package.json
│
├── server/                     # Backend Service (Node.js + Express + WS + MQTT)
│   ├── config/
│   │   └── devices.js          # Broker IP, topic mapping, ESP32-CAM endpoints
│   ├── routes/
│   │   ├── dashboard.js        # GET /api/dashboard (latest telemetry)
│   │   └── control.js          # POST /api/control/cutoff, reset, status
│   ├── services/
│   │   ├── mqttClient.js       # Mosquitto MQTT connection & topic router
│   │   ├── telemetryStore.js   # In-memory store (normalizes hardware vs mock)
│   │   └── mockDataGenerator.js# Realistic telemetry generator for demo mode
│   └── index.js                # Server entry point, WebSocket broadcast
│
├── esp32/                      # Microcontroller Firmware
│   ├── sensor_relay_mqtt/      # Arduino sketch for ESP32 sensor + relay node
│   └── esp32cam/               # ESP32-CAM MJPEG streamer sketch
│
└── package.json                # Root launcher scripts
```

---

## 🔌 Hardware Setup

| Component | Connected To | Description |
|---|---|---|
| **Raspberry Pi 3/4/5** | Hotspot Gateway | Runs Mosquitto MQTT (`1883`) & Node.js Dashboard (`3001`) |
| **ESP32 Dev Module** | Wi-Fi Hotspot | Collects sensor data, controls relay, publishes to MQTT |
| **Relay Module** | ESP32 GPIO 26 | Motor circuit contactor / emergency cutoff |
| **Temperature Sensor** | ESP32 GPIO 4 | DS18B20 1-Wire temperature sensor |
| **Current Sensor (ACS712)** | ESP32 GPIO 34 | Motor current monitoring |
| **Shock / Vibration** | ESP32 GPIO 32 | Accelerometer / piezoelectric vibration sensor |
| **Sound / Acoustic Sensor** | ESP32 GPIO 35 | Sound level / spike detector |
| **ESP32-CAM Module(s)** | Wi-Fi Hotspot | Streams MJPEG video on port 81 (`/stream`) |

---

## 📡 MQTT Interface Specification

The broker operates at `10.42.0.1:1883` (or `127.0.0.1:1883` on local host).

### 1. Telemetry Topic: `conveyor/sensors`
Published by the ESP32 every 500ms–2000ms:
```json
{
  "temp": 32.81,
  "current": 2.90,
  "shock": 1.00,
  "noise": 0,
  "status": "OK"
}
```
*Note: The backend also supports legacy topic `conveyor/sensors/telemetry` and nested payload schemas (`sensors: { ... }`).*

### 2. Relay Control Topic: `conveyor/control/relay`
Published by the Dashboard to trigger or reset the hardware relay:
```json
{
  "action": "CUTOFF",
  "reason": "OPERATOR_EMERGENCY_STOP",
  "timestamp": "2026-09-23T01:30:00.000Z"
}
```
Actions: `"CUTOFF"` | `"RESET"`

### 3. Hardware Alert Topic: `conveyor/alerts/trip`
Published by the ESP32 when an autonomous safety limit is breached:
```json
{
  "reason": "HIGH_VIBRATION_RMS",
  "val": 6.8,
  "limit": 5.0
}
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Mosquitto MQTT Broker**: `sudo apt install mosquitto mosquitto-clients` (on Raspberry Pi/Linux)

---

### A. Running on a Laptop (Development Mode)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd IoTControlRoom-ConveyorBelt
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

3. **Start both backend and frontend concurrently**:
   ```bash
   npm run dev
   ```
   - **Frontend UI**: `http://localhost:5173`
   - **Backend API**: `http://localhost:3001`
   - **WebSocket Feed**: `ws://localhost:3001`

*(In development without live hardware connected, the system automatically runs in simulation mode with realistic real-time telemetry).*

---

### B. Deploying on Raspberry Pi (Production Mode)

1. **Configure Raspberry Pi Wi-Fi Hotspot**:
   - SSID: `RaspberryPi_Hotspot`
   - Gateway IP: `10.42.0.1`

2. **Configure Mosquitto Broker**:
   Edit `/etc/mosquitto/mosquitto.conf` to allow remote LAN/hotspot clients:
   ```conf
   listener 1883
   allow_anonymous true
   ```
   Restart Mosquitto:
   ```bash
   sudo systemctl restart mosquitto
   ```

3. **Build Frontend Bundle**:
   ```bash
   cd client
   npm install
   npm run build
   ```

4. **Start the Production Server**:
   ```bash
   cd ../server
   npm install
   NODE_ENV=production PORT=3001 node index.js
   ```

5. **Access the Dashboard**:
   Connect your laptop, tablet, or phone to the Raspberry Pi Wi-Fi Hotspot, open any browser, and navigate to:
   ```text
   http://10.42.0.1:3001
   ```

---

## 🧪 Testing MQTT Telemetry via Terminal

You can test live telemetry ingestion without flashing the ESP32 using `mosquitto_pub`:

```bash
# Publish simulated hardware telemetry
mosquitto_pub -h 127.0.0.1 -t "conveyor/sensors" -m '{"temp":38.5,"current":3.1,"shock":1.2,"noise":0,"status":"OK"}'

# Subscribe to view all conveyor MQTT messages
mosquitto_sub -h 127.0.0.1 -t "conveyor/#" -v
```

The web dashboard will immediately detect the live hardware packet, switch the status badge to **LIVE (MQTT)**, and display the values in real-time.

---

## 🛡️ License

Developed for the Smart India Hackathon (SIH) 2026.
Distributed under the MIT License.
