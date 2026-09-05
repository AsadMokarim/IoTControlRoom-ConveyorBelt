# Industrial Conveyor Digital Twin — Predictive Maintenance System

A high-performance, interactive 3D WebGL (Three.js) digital twin for monitoring, failure prediction, and telemetry visualization of industrial conveyor belts. 

Built with modular JavaScript architecture to allow easy integration into existing web portals, React/Vue/Angular web dashboards, SCADA systems, or IoT monitoring setups.

---

## 📸 Key Features

- **Realistic 3D Conveyor Visualization**: Procedural belt continuous-loop animation, motor unit, drive & tail drums, return rollers, and structured frame.
- **Interactive Component Raycasting**: Click directly on 3D components (sensors, joints, motor) to highlight telemetry details and metadata.
- **Predictive Maintenance & Failure Simulation**: Simulates degradation sequences (Vibration spike → Overheating → Current surge → Emergency Stop alert).
- **Pluggable Data Architecture**: Decoupled `DataProvider` pattern allows seamless switching between local simulation and live IoT streams (MQTT / WebSockets / HTTP REST API).
- **Embedded Telemetry Dashboard & Live Trend Charts**: Real-time canvas charts for vibration and temperature, health risk indicators for individual belt joints, and visual alert overlays.

---

## 📁 Directory Structure

```text
Digital Twin/
├── index.html                # Main HTML entry point & dashboard UI layout
├── style.css                 # Industrial dark-theme CSS design system
├── package.json              # Project dependencies (Three.js, Vite)
├── src/
│   ├── main.js               # Central orchestrator (3D render loop, event bus)
│   ├── scene/                # Three.js 3D models & setup
│   │   ├── sceneSetup.js     # Three.js renderer, lighting, shadows
│   │   ├── camera.js        # OrbitControls & view reset triggers
│   │   ├── conveyor.js      # Procedural belt geometry & rollers
│   │   ├── motor.js         # Drive motor unit 3D mesh
│   │   ├── joints.js        # Tracked belt joints with state-based visuals
│   │   └── sensors.js       # Custom 3D sensor meshes (Vibration, Temp, Current, Camera)
│   ├── simulation/
│   │   └── failureSimulation.js # Timed degradation & emergency stop engine
│   ├── data/
│   │   └── dataProvider.js   # Data interface (Simulated & MQTT extension hooks)
│   └── ui/                   # Modular UI components
│       ├── dashboard.js      # Sensor values & joint list updates
│       ├── charts.js         # Canvas-based real-time line charts
│       ├── alerts.js         # Overlay emergency alert modal
│       └── twinStatus.js     # Synchronization state & latency monitor
└── public/                   # Static assets
```

---

## 🚀 Quick Start (Standalone Run)

### 1. Prerequisites
Ensure you have **Node.js (v18 or higher)** installed.

### 2. Installation
```bash
# Clone or open project directory
cd "Digital Twin"

# Install dependencies
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser at the URL shown in the terminal (typically `http://localhost:5173`).

### 4. Build for Production
```bash
npm run build
```
This generates static static production assets in the `dist/` folder ready to be served by any static host (Nginx, Vercel, Netlify, Express static, etc.).

---

## 🔌 Dashboard Integration Guide

There are **two primary ways** to integrate this Digital Twin into an external dashboard:

---

### Method A: Embedding via `<iframe>` (Recommended & Quickest)

You can host the Digital Twin application on a URL or subpath (e.g., `http://localhost:5173` or `https://your-domain.com/digital-twin`) and embed it directly into any Web Dashboard (React, Vue, Angular, Next.js, HTML).

#### 1. Add `<iframe>` in HTML / React Component
```html
<div class="twin-container" style="width: 100%; height: 600px; border-radius: 8px; overflow: hidden;">
  <iframe
    id="digital-twin-iframe"
    src="http://localhost:5173"
    style="width: 100%; height: 100%; border: none;"
    title="Conveyor 3D Digital Twin"
  ></iframe>
</div>
```

#### 2. Cross-Window Communication (PostMessage API)
If your main dashboard needs to interact with or control the iframe (e.g. trigger failure simulations or receive emergency alerts):

**Receiving Events from the Digital Twin (Inside Main Dashboard):**
```javascript
window.addEventListener('message', (event) => {
  // Always verify origin in production
  const { type, payload } = event.data;

  switch (type) {
    case 'DIGITAL_TWIN_TELEMETRY':
      console.log('Live Telemetry:', payload.sensorData);
      break;
    case 'DIGITAL_TWIN_ALERT':
      console.warn('Emergency Alert Triggered:', payload.reason);
      // Trigger dashboard toast notification or system alarm sound
      break;
  }
});
```

**Sending Control Commands to the Digital Twin (From Main Dashboard):**
```javascript
const iframeWin = document.getElementById('digital-twin-iframe').contentWindow;

// Trigger Failure Simulation
iframeWin.postMessage({ type: 'START_SIMULATION' }, '*');

// Reset Simulation
iframeWin.postMessage({ type: 'RESET_SIMULATION' }, '*');
```

---

### Method B: Native JavaScript / ES Module Integration

If your colleague wants to import and embed the 3D viewport directly into an existing single-page app (Vite / React / Vue / Webpack):

#### 1. Import Data Provider & UI Engine
```javascript
import { SimulatedDataProvider } from './src/data/dataProvider.js';
import { FailureSimulation } from './src/simulation/failureSimulation.js';

// Initialize data layer
const dataProvider = new SimulatedDataProvider();
dataProvider.start(500); // 500ms update cycle

// Subscribe to real-time data stream
dataProvider.onData(({ sensorData, jointStates, systemState }) => {
  console.log('Vibration (g):', sensorData.vibration);
  console.log('Temperature (°C):', sensorData.temperature);
  console.log('Motor Current (A):', sensorData.motorCurrent);
  console.log('System Health:', systemState.systemHealth);
});
```

---

## 📡 Wiring Live IoT Data (MQTT / WebSockets / REST API)

By default, the application runs on `SimulatedDataProvider`. To wire live physical IoT telemetry (e.g. ESP32 sensors over MQTT or WebSockets), extend the `DataProvider` abstraction in `src/data/dataProvider.js`.

### Payload Data Schema

Ensure your IoT broker or WebSocket server sends data conforming to the following payload format:

```typescript
interface TelemetryPayload {
  sensorData: {
    vibration: number;     // Acceleration in g (e.g. 2.14)
    temperature: number;   // Conveyor belt/bearing temp in °C (e.g. 41.8)
    motorCurrent: number;  // Motor current draw in Amperes (e.g. 1.32)
    beltSpeed: number;     // Speed in m/s (e.g. 0.42)
  };
  jointStates: Array<{
    id: string;            // 'joint_1' | 'joint_2' | 'joint_3' | 'joint_4'
    state: 'NORMAL' | 'WARNING' | 'CRITICAL';
    riskPercent: number;   // 0 - 100
  }>;
  systemState: {
    motorRunning: boolean;
    emergencyStop: boolean;
    systemHealth: 'NORMAL' | 'WARNING' | 'CRITICAL';
    failureProbability: number; // 0 - 100
    syncStatus: 'SYNCHRONIZED' | 'DISCONNECTED';
    lastUpdateMs: number;  // Latency calculation
  };
}
```

### Implementing MQTT Provider Example

Create `src/data/mqttDataProvider.js`:

```javascript
import mqtt from 'mqtt';

export class MQTTDataProvider {
  constructor(brokerUrl = 'ws://broker.emqx.io:8083/mqtt', topic = 'factory/conveyor/telemetry') {
    this._listeners = [];
    this.client = mqtt.connect(brokerUrl);

    this.client.on('connect', () => {
      console.log('Connected to MQTT Broker');
      this.client.subscribe(topic);
    });

    this.client.on('message', (t, payload) => {
      try {
        const data = JSON.parse(payload.toString());
        // Emit parsed payload to subscribers
        for (const callback of this._listeners) {
          callback(data);
        }
      } catch (err) {
        console.error('Failed to parse MQTT message:', err);
      }
    });
  }

  onData(callback) {
    this._listeners.push(callback);
  }

  dispose() {
    if (this.client) this.client.end();
  }
}
```

Then in `src/main.js`, swap `SimulatedDataProvider` with `MQTTDataProvider`:

```javascript
// Change this line in src/main.js
import { MQTTDataProvider } from './data/mqttDataProvider.js';
const dataProvider = new MQTTDataProvider('ws://your-mqtt-broker:8083', 'conveyor/sensor/data');
```

---

## 🎮 Interactive Controls Summary

- **Orbit View**: Left-click + Drag to rotate 3D camera.
- **Pan View**: Right-click + Drag to translate camera.
- **Zoom**: Mouse scroll / Pinch gesture.
- **Inspect Joint / Sensor**: Left-click on 3D rollers, joints, or sensor blocks to inspect targeted telemetry metrics.
- **Simulate Failure**: Click `SIMULATE FAILURE` in the bottom control bar to initiate a step-by-step failure degradation sequence.
- **Reset System**: Click `RESET` to clear alerts and return sensor parameters to normal.
- **Reset Camera**: Click `RESET CAMERA` to re-align camera framing to default overview position.

---

## 🛠️ Tech Stack & Libraries

- **3D Engine**: [Three.js](https://threejs.org/) (WebGL rendering, raycasting, custom procedural geometry)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Charts**: HTML5 2D Canvas custom real-time rendering
- **Typography & Styling**: Inter & JetBrains Mono fonts, Dark Glassmorphism CSS design system

---

## 📄 License

Developed for **SIH 2026 — Digital Twin & Predictive Maintenance Project**. Open for integration and research use.
