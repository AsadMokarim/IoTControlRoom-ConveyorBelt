import { Router } from 'express';
import { publishMessage, isMqttConnected } from '../services/mqttClient.js';

const router = Router();

const COMMAND_TOPIC = process.env.MQTT_CONVEYOR_COMMAND_TOPIC || 'conveyor/esp32-01/command';
const VALID_COMMANDS = ['ON', 'OFF'];

/**
 * POST /api/conveyor/control
 * Body: { "command": "ON" } or { "command": "OFF" }
 */
router.post('/control', async (req, res) => {
  const { command } = req.body;

  // Validate command
  if (!command || !VALID_COMMANDS.includes(command.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid command. Use ON or OFF.',
    });
  }

  const normalizedCommand = command.toUpperCase();

  // Check MQTT connection
  if (!isMqttConnected()) {
    return res.status(503).json({
      success: false,
      message: 'MQTT broker is not connected. Command not sent.',
    });
  }

  try {
    await publishMessage(COMMAND_TOPIC, normalizedCommand, { qos: 1 });
    return res.json({
      success: true,
      command: normalizedCommand,
      message: `${normalizedCommand} command published`,
    });
  } catch (err) {
    console.error('[Conveyor] Failed to publish command:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to publish MQTT command.',
    });
  }
});

export default router;
