/**
 * telemetryStore.js
 * Singleton in-memory state store.
 * Holds the latest telemetry pushed by ESP32 via MQTT or HTTP.
 * Falls back to generateMockTelemetry() when hardware is offline (> 5s without push).
 */

import { generateMockTelemetry, randomFloat, randomInt } from './mockDataGenerator.js';

const LIVE_TIMEOUT_MS = 10000;

class TelemetryStore {
  constructor() {
    this._latest = null;
    this._lastPushAt = 0;
    this._relay = {
      state: 'CLOSED',
      trip_triggered: false,
      trip_reason: 'NONE',
      tripped_at: null,
    };
    this._broadcastFn = null;
  }

  setBroadcast(fn) {
    this._broadcastFn = fn;
  }

  updateFromDevice(payload) {
    this._lastPushAt = Date.now();

    const s = payload.sensors || {};
    const relay = payload.relay || {};

    // Extract raw fields supporting both flat and nested schemas:
    // Flat: {"temp":32.81, "current":2.90, "shock":1.00, "noise":0, "status":"OK"}
    // Nested: { sensors: { temperature: 32.81, ... }, relay: { ... } }
    const rawTemp = payload.temp ?? payload.temperature ?? s.temperature ?? s.temp;
    const rawCurrent = payload.current ?? payload.motor_current ?? s.motor_current ?? s.current;
    const rawShock = payload.shock ?? payload.vibration ?? payload.vibration_rms ?? s.vibration_rms ?? s.shock;
    const rawNoise = payload.noise ?? payload.acoustic_db ?? s.acoustic_db ?? s.noise;
    const rawStatus = payload.status ?? relay.state ?? payload.system_status;

    const temp = rawTemp !== undefined ? Number(Number(rawTemp).toFixed(1)) : 45.0;
    // Current: use magnitude; if INA219 raw mA > 50 (e.g. 2200 mA), convert to A
    let current = rawCurrent !== undefined ? Number(Math.abs(Number(rawCurrent))) : 1.35;
    if (current > 50) {
      current = current / 1000;
    }
    current = Number(current.toFixed(2));

    const vibRms = rawShock !== undefined ? Number(Number(rawShock).toFixed(2)) : 2.1;

    // For noise / acoustic:
    // If digital sensor (0 or 1), 0 = normal ambient sound (~54 dB), 1 = spike (>86 dB)
    // If I2S pure_audio (0 to 150000+ where MAX_NOISE = 150000), map dynamically:
    let acoustic = 54.2;
    if (rawNoise !== undefined) {
      const n = Number(rawNoise);
      if (n <= 1) {
        acoustic = n === 1 ? 86.8 : 54.2;
      } else if (n > 150) {
        const ratio = Math.min(n / 150000, 1.5);
        acoustic = Number((48 + ratio * 47).toFixed(1));
      } else {
        acoustic = Number(n.toFixed(1));
      }
    }

    // Check status or cutoff from ESP32 (including "FAULT" from safety limits)
    const statusUpper = String(rawStatus || '').toUpperCase();
    const isHardwareTrip = statusUpper === 'FAULT' || statusUpper === 'TRIP' || statusUpper === 'TRIPPED' || statusUpper === 'CUTOFF' || statusUpper === 'ALERT';

    // Update relay state if provided by device
    const wasTripped = this._relay.trip_triggered;
    if (isHardwareTrip) {
      this._relay.state = 'TRIPPED';
      this._relay.trip_triggered = true;
      this._relay.trip_reason = payload.reason || 'HARDWARE_AUTOCUTOFF';
      if (!wasTripped) this._relay.tripped_at = new Date().toISOString();
    } else if (relay.state || relay.trip_triggered !== undefined) {
      this._relay = {
        state: relay.state ?? this._relay.state,
        trip_triggered: relay.trip_triggered ?? this._relay.trip_triggered,
        trip_reason: relay.trip_reason ?? this._relay.trip_reason,
        tripped_at: relay.trip_triggered && !wasTripped
          ? new Date().toISOString()
          : this._relay.tripped_at,
      };
    }

    // Determine system status based on sensors and relay
    let system_status = 'normal';
    if (this._relay.state === 'TRIPPED' || this._relay.trip_triggered) {
      system_status = 'critical';
    } else if (temp > 75 || vibRms > 4.5 || current > 20.0 || acoustic > 85) {
      system_status = 'warning';
    }

    const now = new Date();
    const timestamp = now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, '0') + "-" +
      String(now.getDate()).padStart(2, '0') + " " +
      String(now.getHours()).padStart(2, '0') + ":" +
      String(now.getMinutes()).padStart(2, '0') + ":" +
      String(now.getSeconds()).padStart(2, '0');

    // Default mock-like thermal zones scaled around real sensor temp if not provided
    const thermalZones = payload.thermal_zones || [
      { id: "motor_1", name: "Motor 1", temperature: Number((temp * 1.05).toFixed(1)) },
      { id: "bearing_1", name: "Bearing 1", temperature: Number((temp * 1.12).toFixed(1)) },
      { id: "pump_1", name: "Pump 1", temperature: Number((temp * 0.95).toFixed(1)) },
      { id: "fan_1", name: "Fan 1", temperature: Number((temp * 0.85).toFixed(1)) }
    ];

    // Preserve or default joints
    const joints = payload.joints || [
      {
        id: "joint_1",
        name: "Joint 1 (Splice A)",
        state: system_status === 'critical' ? 'ALERT' : 'NORMAL',
        riskPercent: system_status === 'critical' ? 65 : randomInt(8, 15),
        temperature: Number((temp * 0.92).toFixed(1)),
        vibration: Number((vibRms * 0.7).toFixed(2)),
        gapWidth: 1.8,
        wearLevel: 14,
        tension: 96
      },
      {
        id: "joint_2",
        name: "Joint 2 (Splice B)",
        state: system_status === 'critical' ? 'CRITICAL' : 'NORMAL',
        riskPercent: system_status === 'critical' ? 88 : randomInt(18, 28),
        temperature: Number((temp * 1.08).toFixed(1)),
        vibration: Number((vibRms * 1.1).toFixed(2)),
        gapWidth: 2.6,
        wearLevel: 32,
        tension: 90
      },
      {
        id: "joint_3",
        name: "Joint 3 (Splice C)",
        state: 'NORMAL',
        riskPercent: randomInt(5, 10),
        temperature: Number((temp * 0.88).toFixed(1)),
        vibration: Number((vibRms * 0.5).toFixed(2)),
        gapWidth: 1.4,
        wearLevel: 10,
        tension: 98
      },
      {
        id: "joint_4",
        name: "Joint 4 (Splice D)",
        state: system_status === 'critical' ? 'ALERT' : 'NORMAL',
        riskPercent: system_status === 'critical' ? 72 : randomInt(20, 32),
        temperature: Number((temp * 1.15).toFixed(1)),
        vibration: Number((vibRms * 1.25).toFixed(2)),
        gapWidth: 3.1,
        wearLevel: 38,
        tension: 86
      }
    ];

    this._latest = {
      timestamp,
      system_status,
      is_live: true,
      kpis: {
        average_temperature: temp,
        maximum_temperature: Number((temp * 1.15).toFixed(1)),
        rms_vibration: vibRms,
        motor_current: current,
        acoustic_db: acoustic,
        online_sensors: 14,
        total_sensors: 14,
        active_alerts: this._relay.state === 'TRIPPED' ? 1 : (system_status === 'warning' ? 1 : 0),
      },
      thermal_zones: thermalZones,
      vibration: {
        rms: vibRms,
        peak: Number((vibRms * 1.4).toFixed(2)),
        frequency: 50,
      },
      joints,
      relay: { ...this._relay },
    };

    if (this._broadcastFn) {
      this._broadcastFn(this._latest);
    }
  }

  getLatest() {
    const isLive = this._latest !== null && (Date.now() - this._lastPushAt) < LIVE_TIMEOUT_MS;

    if (isLive) {
      return { ...this._latest, is_live: true, relay: { ...this._relay } };
    }

    const mock = generateMockTelemetry();
    // Include acoustic_db and relay in mock payload as well
    mock.kpis.acoustic_db = randomFloat(62.0, 74.5);
    return {
      ...mock,
      is_live: false,
      relay: { ...this._relay },
    };
  }

  getRelayState() {
    return { ...this._relay };
  }

  setRelayState(patch) {
    const wasTripped = this._relay.trip_triggered;
    this._relay = { ...this._relay, ...patch };

    if (patch.trip_triggered && !wasTripped) {
      this._relay.tripped_at = new Date().toISOString();
    }
    if (patch.state === 'CLOSED') {
      this._relay.trip_triggered = false;
      this._relay.tripped_at = null;
      this._relay.trip_reason = 'NONE';
    }

    const currentData = this.getLatest();
    currentData.relay = { ...this._relay };
    if (this._relay.state === 'TRIPPED') {
      currentData.system_status = 'critical';
      currentData.kpis.active_alerts = Math.max(1, currentData.kpis.active_alerts);
    }

    if (this._broadcastFn) {
      this._broadcastFn(currentData);
    }
  }
}

export default new TelemetryStore();
