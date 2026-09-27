export function randomFloat(min, max, precision = 2) {
  const value = min + Math.random() * (max - min);
  return Number(value.toFixed(precision));
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function generateClientMockTelemetry(relayState = { state: 'CLOSED', trip_triggered: false, trip_reason: 'NONE' }) {
  const isTripped = relayState?.state === 'TRIPPED' || relayState?.trip_triggered;
  const now = new Date();
  const timestamp = formatTimestamp(now);

  // Smooth sinusoidal time-based wave with micro-fluctuations
  const t = now.getTime() / 1000;
  const tempWave = Math.sin(t / 8) * 1.2;
  const vibWave = Math.cos(t / 5) * 0.22;
  const curWave = Math.sin(t / 11) * 0.05;

  const avgTemp = Number((45.2 + tempWave + (Math.random() * 0.4 - 0.2)).toFixed(1));
  const maxTemp = Number((avgTemp + 6.8 + (Math.random() * 0.6 - 0.3)).toFixed(1));

  let vibration = 0.0;
  let current = 0.0;
  let acoustic = 44.5; // ambient idle background

  if (!isTripped) {
    vibration = Number(Math.max(0.8, 2.15 + vibWave + (Math.random() * 0.25 - 0.12)).toFixed(2));
    current = Number(Math.max(0.5, 1.42 + curWave + (Math.random() * 0.06 - 0.03)).toFixed(2));
    acoustic = Number((68.2 + Math.sin(t / 6) * 3.2 + (Math.random() * 1.2 - 0.6)).toFixed(1));
  }

  const systemStatus = isTripped ? 'critical' : 'normal';
  const activeAlerts = isTripped ? 1 : 0;

  const thermalZones = [
    { id: 'motor_1', name: 'Motor 1', temperature: Number((avgTemp * 1.04).toFixed(1)) },
    { id: 'bearing_1', name: 'Bearing 1', temperature: Number((avgTemp * 1.12).toFixed(1)) },
    { id: 'pump_1', name: 'Pump 1', temperature: Number((avgTemp * 0.94).toFixed(1)) },
    { id: 'fan_1', name: 'Fan 1', temperature: Number((avgTemp * 0.86).toFixed(1)) },
  ];

  const joints = [
    {
      id: 'joint_1',
      name: 'Joint 1 (Splice A)',
      state: isTripped ? 'ALERT' : 'NORMAL',
      riskPercent: isTripped ? 65 : randomInt(8, 12),
      temperature: Number((avgTemp * 0.93).toFixed(1)),
      vibration: Number((vibration * 0.7).toFixed(2)),
      gapWidth: 1.8,
      wearLevel: 14,
      tension: 96,
    },
    {
      id: 'joint_2',
      name: 'Joint 2 (Splice B)',
      state: isTripped ? 'CRITICAL' : 'NORMAL',
      riskPercent: isTripped ? 88 : randomInt(18, 24),
      temperature: Number((avgTemp * 1.08).toFixed(1)),
      vibration: Number((vibration * 1.1).toFixed(2)),
      gapWidth: 2.6,
      wearLevel: 32,
      tension: 90,
    },
    {
      id: 'joint_3',
      name: 'Joint 3 (Splice C)',
      state: 'NORMAL',
      riskPercent: randomInt(4, 8),
      temperature: Number((avgTemp * 0.89).toFixed(1)),
      vibration: Number((vibration * 0.5).toFixed(2)),
      gapWidth: 1.4,
      wearLevel: 10,
      tension: 98,
    },
    {
      id: 'joint_4',
      name: 'Joint 4 (Splice D)',
      state: isTripped ? 'ALERT' : 'NORMAL',
      riskPercent: isTripped ? 72 : randomInt(20, 28),
      temperature: Number((avgTemp * 1.14).toFixed(1)),
      vibration: Number((vibration * 1.2).toFixed(2)),
      gapWidth: 3.1,
      wearLevel: 38,
      tension: 86,
    },
  ];

  return {
    timestamp,
    system_status: systemStatus,
    is_live: false,
    kpis: {
      average_temperature: avgTemp,
      maximum_temperature: maxTemp,
      rms_vibration: vibration,
      motor_current: current,
      acoustic_db: acoustic,
      online_sensors: 14,
      total_sensors: 14,
      active_alerts: activeAlerts,
    },
    thermal_zones: thermalZones,
    vibration: {
      rms: vibration,
      peak: Number((vibration * 1.4).toFixed(2)),
      frequency: isTripped ? 0 : Number((50 + Math.sin(t / 4) * 0.8).toFixed(1)),
    },
    joints,
    relay: {
      state: isTripped ? 'TRIPPED' : 'CLOSED',
      trip_triggered: Boolean(isTripped),
      trip_reason: relayState?.trip_reason || (isTripped ? 'MANUAL_STOP' : 'NONE'),
      tripped_at: relayState?.tripped_at || (isTripped ? timestamp : null),
    },
  };
}
