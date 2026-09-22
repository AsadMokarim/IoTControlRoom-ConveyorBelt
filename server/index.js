import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
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
  console.log(`=======================================================`);
});
