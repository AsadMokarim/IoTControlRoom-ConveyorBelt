import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http, { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import dashboardRoutes from './routes/dashboard.js';
import controlRoutes from './routes/control.js';
import telemetryStore from './services/telemetryStore.js';
import mqttClient from './services/mqttClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();

// Allow all origins for hotspot & LAN access
app.use(cors({ origin: '*' }));
app.use(express.json());

// ============================================================================
// ESP32-CAM MJPEG Video Relay Proxy
// ============================================================================
const ESP32_CAM_URL = process.env.ESP32_CAM_STREAM_URL || 'http://10.42.0.118:81/stream';

// Maintain array of connected client response objects
const streamClients = [];

// Boundary header format used by ESP32-CAM CameraWebServer
let cameraContentType = 'multipart/x-mixed-replace; boundary=123456789000000000000987654321';
let activeCamReq = null;
let reconnectTimer = null;

// Pipe incoming data chunks from the camera stream directly to all connected clients
function broadcastChunkToClients(chunk) {
  for (let i = streamClients.length - 1; i >= 0; i--) {
    const client = streamClients[i];
    try {
      if (client.writable && !client.writableEnded) {
        client.write(chunk);
      } else {
        streamClients.splice(i, 1);
      }
    } catch (err) {
      streamClients.splice(i, 1);
    }
  }
}

function cleanupCameraConnection() {
  if (activeCamReq) {
    const req = activeCamReq;
    activeCamReq = null;
    try {
      req.destroy();
    } catch (_) {}
  }
}

function scheduleCameraReconnect(delayMs = 2500) {
  if (reconnectTimer) return;
  console.log(`[MJPEG Relay] Scheduling camera reconnect in ${delayMs / 1000}s...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectToCameraStream();
  }, delayMs);
}

// Background HTTP request loop that connects to the ESP32-CAM stream with auto-reconnect
function connectToCameraStream() {
  cleanupCameraConnection();
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  console.log(`[MJPEG Relay] Connecting to ESP32-CAM stream at ${ESP32_CAM_URL}...`);

  try {
    const req = http.get(ESP32_CAM_URL, (camRes) => {
      if (camRes.statusCode !== 200) {
        console.warn(`[MJPEG Relay] ESP32-CAM returned status HTTP ${camRes.statusCode}. Retrying in 3s...`);
        camRes.resume(); // Drain stream to release resources
        cleanupCameraConnection();
        scheduleCameraReconnect(3000);
        return;
      }

      console.log('[MJPEG Relay] Successfully connected to ESP32-CAM stream');
      if (camRes.headers['content-type']) {
        cameraContentType = camRes.headers['content-type'];
      }

      // Pipe data chunks directly to all connected clients
      camRes.on('data', (chunk) => {
        broadcastChunkToClients(chunk);
      });

      camRes.on('end', () => {
        console.warn('[MJPEG Relay] ESP32-CAM stream ended. Reconnecting...');
        cleanupCameraConnection();
        scheduleCameraReconnect(2000);
      });

      camRes.on('close', () => {
        console.warn('[MJPEG Relay] ESP32-CAM stream closed. Reconnecting...');
        cleanupCameraConnection();
        scheduleCameraReconnect(2000);
      });

      camRes.on('error', (err) => {
        console.error('[MJPEG Relay] Stream error:', err.message);
        cleanupCameraConnection();
        scheduleCameraReconnect(3000);
      });
    });

    req.on('error', (err) => {
      console.error(`[MJPEG Relay] Camera connection error (${err.message}). Retrying in 3s...`);
      cleanupCameraConnection();
      scheduleCameraReconnect(3000);
    });

    req.setTimeout(10000, () => {
      console.warn('[MJPEG Relay] Connection timed out after 10s. Aborting socket...');
      req.destroy();
    });

    activeCamReq = req;
  } catch (err) {
    console.error('[MJPEG Relay] Unexpected connection error:', err.message);
    scheduleCameraReconnect(3000);
  }
}

// Start the background camera connection loop
connectToCameraStream();

// Route: /api/stream - MJPEG video relay proxy endpoint
app.get('/api/stream', (req, res) => {
  // Set multipart/x-mixed-replace headers for continuous MJPEG video frame delivery
  res.writeHead(200, {
    'Content-Type': cameraContentType,
    'Cache-Control': 'no-cache, no-store, must-revalidate, pre-check=0, post-check=0, max-age=0',
    'Pragma': 'no-cache',
    'Connection': 'close',
    'Access-Control-Allow-Origin': '*',
  });

  streamClients.push(res);
  console.log(`[MJPEG Relay] Client connected to /api/stream (${streamClients.length} active)`);

  // Remove and clean up client when disconnected
  const removeClient = () => {
    const idx = streamClients.indexOf(res);
    if (idx !== -1) {
      streamClients.splice(idx, 1);
      console.log(`[MJPEG Relay] Client disconnected from /api/stream (${streamClients.length} remaining)`);
    }
  };

  req.on('close', removeClient);
  res.on('finish', removeClient);
  res.on('error', removeClient);
});

// Mount API routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/control', controlRoutes);

// Optional HTTP telemetry push endpoint (backup for curl or direct HTTP)
app.post('/api/telemetry', (req, res) => {
  try {
    telemetryStore.updateFromDevice(req.body);
    res.json({ ok: true, received_at: new Date().toISOString() });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Serve static frontend assets in production (when built on Pi)
const distPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
  console.log(`[Static] Serving client build from ${distPath}`);
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const server = createServer(app);

// WebSocket server for real-time telemetry push to browser
const wss = new WebSocketServer({ server });

function broadcast(payload) {
  const json = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(json);
    }
  }
}

// Wire store broadcast to WebSocket clients
telemetryStore.setBroadcast(broadcast);

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected to live telemetry stream');

  // Send current state immediately on connect
  ws.send(JSON.stringify(telemetryStore.getLatest()));

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });
});

// Heartbeat loop: if hardware push is not active (mock demo mode), broadcast mock data every 1000ms
setInterval(() => {
  const latest = telemetryStore.getLatest();
  // Only broadcast on timer if running mock/demo mode so we don't overwrite high-frequency MQTT
  if (!latest.is_live) {
    broadcast(latest);
  }
}, 1000);

// Initialize MQTT client
mqttClient.init();

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`  IoT Conveyor Belt Server running on http://${HOST}:${PORT}`);
  console.log(`  WebSocket live stream: ws://${HOST}:${PORT}`);
  console.log(`  MJPEG Video Relay: http://${HOST}:${PORT}/api/stream -> ${ESP32_CAM_URL}`);
  console.log(`=======================================================`);
});
