import { Router } from 'express';
import { generateMockTelemetry } from '../services/mockDataGenerator.js';

const router = Router();

router.get('/', (req, res) => {
    try {
        const data = generateMockTelemetry();
        res.json(data);
    } catch (error) {
        console.error('Error generating telemetry:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
