import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dashboardRoutes from './routes/dashboard.js';
import conveyorRoutes from './routes/conveyor.js';
import { connectMqtt } from './services/mqttClient.js';
import { generateMockTelemetry } from './services/mockDataGenerator.js';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Mount API routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/conveyor', conveyorRoutes);

const server = createServer(app);

// Optional WebSocket server for real-time telemetry push
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Send initial data
    ws.send(JSON.stringify(generateMockTelemetry()));

    // Broadcast mock data every 1000ms
    const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(generateMockTelemetry()));
        }
    }, 1000);

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });
});

connectMqtt();

server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
