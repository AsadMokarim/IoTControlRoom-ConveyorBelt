# Project Structure — IoT Control Room Conveyor Belt

```text
IoTControlRoom-ConveyorBelt/
├── client/                                # React Frontend application
│   ├── public/                            # Static public assets (icons, sounds)
│   ├── src/
│   │   ├── assets/                        # Design assets, styling variables
│   │   ├── components/
│   │   │   ├── cameras/                   # ESP32-CAM monitoring
│   │   │   │   ├── CameraFeedCard.jsx     # MJPEG stream card with status pill
│   │   │   │   ├── CameraGrid.jsx         # Responsive camera surveillance grid
│   │   │   │   └── CameraPage.jsx         # Dedicated full-page camera view
│   │   │   ├── dashboard/                 # SCADA monitoring components
│   │   │   │   ├── AcousticMeter.jsx      # Audio dB SPL bar meter
│   │   │   │   ├── AlertRing.jsx          # Active alarm annunciator
│   │   │   │   ├── DegradationTimeline.jsx# Splice degradation stage indicator
│   │   │   │   ├── DigitalTwinStatus.jsx  # Asset condition table
│   │   │   │   ├── EmergencyStopPanel.jsx # Contactor cutoff & reset controls
│   │   │   │   ├── HealthScore.jsx        # Overall system health index
│   │   │   │   ├── RelayStatusBadge.jsx   # Live MQTT vs Simulation badge
│   │   │   │   ├── TemperatureGauge.jsx   # Thermal gauge component
│   │   │   │   ├── ThermalMap.jsx         # Heatmap of thermal zones
│   │   │   │   ├── VibrationChart.jsx     # Historian line chart
│   │   │   │   └── VibrationMeter.jsx     # RMS vibration bar gauge
│   │   │   └── digital-twin/              # 3D Conveyor Digital Twin (Three.js)
│   │   │       ├── scene/
│   │   │       │   ├── camera.js          # Orbit controls & presets
│   │   │       │   ├── conveyor.js        # Belt mesh, texture offset animation
│   │   │       │   ├── joints.js          # Belt splices & condition markers
│   │   │       │   ├── motor.js           # Drive motor housing & shaft
│   │   │       │   ├── sceneSetup.js      # Three.js scene, lighting & shadows
│   │   │       │   └── sensors.js         # Interactive sensor callout tags
│   │   │       ├── DigitalTwinCanvas.jsx  # Main Three.js WebGL canvas wrapper
│   │   │       ├── DigitalTwinPage.jsx    # Dedicated 3D Digital Twin page
│   │   │       └── TwinAlertOverlay.jsx   # Emergency shutdown modal overlay
│   │   ├── hooks/
│   │   │   ├── useControl.js              # Hardware relay cutoff & reset API hooks
│   │   │   ├── useTelemetry.js            # WebSocket stream + HTTP fallback hook
│   │   │   └── useTheme.js                # SCADA Dark/Light theme manager
│   │   ├── App.jsx                        # Main application layout & state routing
│   │   ├── index.css                      # Global industrial styles
│   │   └── main.jsx                       # React entry point
│   ├── index.html                         # SPA HTML entry point
│   ├── package.json                       # Client dependencies (Three.js, Lucide, Vite)
│   └── vite.config.js                     # Vite build & proxy configuration
│
├── server/                                # Node.js Backend Service
│   ├── config/
│   │   └── devices.js                     # MQTT broker endpoints, topics & CAM IPs
│   ├── routes/
│   │   ├── control.js                     # Endpoints for cutoff, reset, and status
│   │   └── dashboard.js                   # Telemetry snapshot endpoint
│   ├── services/
│   │   ├── mockDataGenerator.js           # High-fidelity simulation telemetry engine
│   │   ├── mqttClient.js                  # Mosquitto MQTT client & candidate fallback
│   │   └── telemetryStore.js              # State store, payload normalizer & broadcaster
│   ├── index.js                           # Express server, WebSocket broker & heartbeat
│   └── package.json                       # Server dependencies (express, ws, mqtt, cors)
│
├── esp32/                                 # Embedded Microcontroller Firmware
│   ├── sensor_relay_mqtt/                 # Main ESP32 sensor node & safety relay
│   │   └── sensor_relay_mqtt.ino          # Arduino firmware (MQTT publish & relay trip)
│   └── esp32cam/                          # Video surveillance firmware
│       └── esp32cam_mjpeg.ino             # Arduino sketch for Wi-Fi MJPEG streaming
│
├── package.json                           # Root scripts (npm run dev, install:all, build)
└── README.md                              # Complete system documentation
```
