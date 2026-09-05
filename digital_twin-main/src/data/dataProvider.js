/**
 * dataProvider.js
 * 
 * Abstract data layer for the digital twin.
 * 
 * Architecture:
 *   DataProvider (abstract)
 *     ├── SimulatedDataProvider  ← current (generates fake sensor data)
 *     └── MQTTDataProvider       ← future  (ESP32 → Mosquitto → WebSocket)
 * 
 * The 3D visualization and dashboard consume data through this interface,
 * making the data source swappable without modifying the frontend.
 * 
 * Data flow:
 *   Data Provider → Normalized sensor state → Digital Twin state → 3D + Dashboard
 */

/**
 * @typedef {Object} SensorData
 * @property {number} vibration     - Acceleration in g
 * @property {number} temperature   - Belt temperature in °C
 * @property {number} motorCurrent  - Motor current in A
 * @property {number} beltSpeed     - Belt speed in m/s
 */

/**
 * @typedef {Object} JointState
 * @property {string} id
 * @property {string} state        - 'NORMAL' | 'WARNING' | 'CRITICAL'
 * @property {number} riskPercent  - 0-100
 */

/**
 * @typedef {Object} SystemState
 * @property {boolean} motorRunning
 * @property {boolean} emergencyStop
 * @property {string}  systemHealth    - 'NORMAL' | 'WARNING' | 'CRITICAL'
 * @property {number}  failureProbability - 0-100
 * @property {string}  syncStatus      - 'SYNCHRONIZED' | 'DISCONNECTED'
 * @property {number}  lastUpdateMs    - ms since last update
 */

// ============================================================
// SimulatedDataProvider
// ============================================================

export class SimulatedDataProvider {
  constructor() {
    this._listeners = [];
    this._tickInterval = null;

    // Baseline sensor values (normal operating conditions)
    this._baselines = {
      vibration: 2.14,
      temperature: 41.8,
      motorCurrent: 1.32,
      beltSpeed: 0.42,
    };

    // Current sensor values
    this.sensorData = { ...this._baselines };

    // Joint states
    this.jointStates = [
      { id: 'joint_1', state: 'NORMAL', riskPercent: 8 },
      { id: 'joint_2', state: 'NORMAL', riskPercent: 6 },
      { id: 'joint_3', state: 'NORMAL', riskPercent: 5 },
      { id: 'joint_4', state: 'NORMAL', riskPercent: 7 },
    ];

    // System state
    this.systemState = {
      motorRunning: true,
      emergencyStop: false,
      systemHealth: 'NORMAL',
      failureProbability: 5,
      syncStatus: 'SYNCHRONIZED',
      lastUpdateMs: 0,
    };

    // Failure multipliers (manipulated by failureSimulation)
    this._failureMultipliers = {
      vibration: 1.0,
      temperature: 1.0,
      motorCurrent: 1.0,
    };

    this._lastTick = Date.now();
    this._noisePhase = Math.random() * 1000;
  }

  /**
   * Subscribe to data updates.
   * @param {Function} callback - Called with { sensorData, jointStates, systemState }
   */
  onData(callback) {
    this._listeners.push(callback);
  }

  /**
   * Start automatic data updates.
   * @param {number} intervalMs - Update interval in ms (default 500)
   */
  start(intervalMs = 500) {
    this._tickInterval = setInterval(() => this.tick(), intervalMs);
  }

  /**
   * Perform one data update cycle.
   */
  tick() {
    const now = Date.now();
    const dt = (now - this._lastTick) / 1000;
    this._lastTick = now;
    this._noisePhase += dt;

    // Generate fluctuating sensor values around baselines with failure multipliers
    this.sensorData.vibration = this._fluctuate(
      this._baselines.vibration * this._failureMultipliers.vibration, 0.15
    );
    this.sensorData.temperature = this._fluctuate(
      this._baselines.temperature * this._failureMultipliers.temperature, 1.0
    );
    this.sensorData.motorCurrent = this._fluctuate(
      this._baselines.motorCurrent * this._failureMultipliers.motorCurrent, 0.05
    );
    this.sensorData.beltSpeed = this.systemState.motorRunning
      ? this._fluctuate(this._baselines.beltSpeed, 0.02)
      : 0;

    // Update system state timing
    this.systemState.lastUpdateMs = Date.now() % 2000; // simulated latency

    // Determine overall system health from joint states
    const hasAnyCritical = this.jointStates.some(j => j.state === 'CRITICAL');
    const hasAnyWarning = this.jointStates.some(j => j.state === 'WARNING');
    if (hasAnyCritical) {
      this.systemState.systemHealth = 'CRITICAL';
    } else if (hasAnyWarning) {
      this.systemState.systemHealth = 'WARNING';
    } else {
      this.systemState.systemHealth = 'NORMAL';
    }

    // Failure probability is the max risk across joints
    this.systemState.failureProbability = Math.max(
      ...this.jointStates.map(j => j.riskPercent)
    );

    // Notify listeners
    const data = {
      sensorData: { ...this.sensorData },
      jointStates: this.jointStates.map(j => ({ ...j })),
      systemState: { ...this.systemState },
    };
    for (const cb of this._listeners) {
      cb(data);
    }
  }

  /**
   * Apply failure multipliers (used by failureSimulation).
   */
  setFailureMultipliers(multipliers) {
    Object.assign(this._failureMultipliers, multipliers);
  }

  /**
   * Update a specific joint's state.
   */
  setJointState(jointId, state, riskPercent) {
    const joint = this.jointStates.find(j => j.id === jointId);
    if (joint) {
      joint.state = state;
      joint.riskPercent = riskPercent;
    }
  }

  /**
   * Set emergency stop state.
   */
  setEmergencyStop(active) {
    this.systemState.emergencyStop = active;
    this.systemState.motorRunning = !active;
    if (active) {
      this.sensorData.beltSpeed = 0;
    }
  }

  /**
   * Reset all values to healthy baseline.
   */
  reset() {
    this._failureMultipliers = {
      vibration: 1.0,
      temperature: 1.0,
      motorCurrent: 1.0,
    };
    this.jointStates.forEach((j, i) => {
      j.state = 'NORMAL';
      j.riskPercent = 5 + Math.floor(Math.random() * 8);
    });
    this.systemState.motorRunning = true;
    this.systemState.emergencyStop = false;
    this.systemState.systemHealth = 'NORMAL';
    this.systemState.failureProbability = 5;
  }

  /**
   * Generates a fluctuating value around a center point using smooth noise.
   */
  _fluctuate(center, spread) {
    const noise = Math.sin(this._noisePhase * 1.7) * 0.3 +
                  Math.sin(this._noisePhase * 3.1) * 0.2 +
                  Math.sin(this._noisePhase * 7.3) * 0.1 +
                  (Math.random() - 0.5) * 0.4;
    return Math.max(0, center + noise * spread);
  }

  /**
   * Cleanup.
   */
  dispose() {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
    }
    this._listeners = [];
  }
}

// ============================================================
// Future: MQTTDataProvider
// ============================================================
// 
// import mqtt from 'mqtt';
// 
// export class MQTTDataProvider {
//   constructor(brokerUrl, topics) {
//     this._client = mqtt.connect(brokerUrl);
//     this._listeners = [];
//     this._client.on('connect', () => {
//       for (const topic of topics) {
//         this._client.subscribe(topic);
//       }
//     });
//     this._client.on('message', (topic, payload) => {
//       const data = JSON.parse(payload.toString());
//       // normalize and emit...
//     });
//   }
//   onData(callback) { this._listeners.push(callback); }
//   dispose() { this._client.end(); }
// }
