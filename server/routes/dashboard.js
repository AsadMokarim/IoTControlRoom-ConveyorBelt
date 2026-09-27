import { Router } from 'express';
import telemetryStore from '../services/telemetryStore.js';

const router = Router();

router.get('/', (req, res) => {
    try {
        const data = telemetryStore.getLatest();
        res.json(data);
    } catch (error) {
        console.error('Error fetching dashboard telemetry:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
