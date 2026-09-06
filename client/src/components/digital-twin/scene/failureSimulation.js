/**
 * failureSimulation.js
 * 
 * Orchestrates the degradation demo sequence for SIH demonstration.
 * 
 * Sequence (using Joint 3 as default failure case):
 * 
 *   Stage 1 — Normal (0-3s):     All healthy, baseline values
 *   Stage 2 — Degradation (3-9s): Vibration/temp/current rise, Joint 3 → WARNING
 *   Stage 3 — Critical (9-13s):   Risk > 90%, Joint 3 → CRITICAL
 *   Stage 4 — Safety (13s+):      Emergency stop, motor off, belt stops
 * 
 * Physical → Digital mapping:
 *   Physical Joint 3 → vibration/temperature/current data
 *   → anomaly detection → Joint_03 changes GREEN → AMBER → RED
 *   → failure probability increases → emergency-stop condition
 *   → relay cuts motor power → digital twin also stops
 */

const FAILURE_JOINT_ID = 'joint_3';
const TOTAL_DURATION = 15; // seconds

export class FailureSimulation {
  constructor(dataProvider) {
    this._dataProvider = dataProvider;
    this._running = false;
    this._elapsed = 0;
    this._onStageChange = null;
    this._currentStage = 'idle';
  }

  /**
   * Subscribe to stage change events.
   * @param {Function} callback - (stage: string, data: object)
   */
  onStageChange(callback) {
    this._onStageChange = callback;
  }

  /**
   * Whether the simulation is currently running.
   */
  get isRunning() {
    return this._running;
  }

  get currentStage() {
    return this._currentStage;
  }

  /**
   * Start the failure simulation.
   */
  start() {
    if (this._running) return;
    this._running = true;
    this._elapsed = 0;
    this._currentStage = 'normal';
    this._emitStage('started', {});
  }

  /**
   * Update the simulation — call each frame with deltaTime in seconds.
   */
  update(deltaTime) {
    if (!this._running) return;

    this._elapsed += deltaTime;
    const t = this._elapsed;
    const dp = this._dataProvider;

    // ========================================
    // Stage 1: Normal (0–3s)
    // ========================================
    if (t < 3) {
      if (this._currentStage !== 'normal') {
        this._currentStage = 'normal';
        this._emitStage('normal', {});
      }
      // Values stay at baseline
      return;
    }

    // ========================================
    // Stage 2: Degradation (3–9s)
    // ========================================
    if (t < 9) {
      const progress = (t - 3) / 6; // 0→1 over 6s
      
      if (this._currentStage !== 'degradation') {
        this._currentStage = 'degradation';
        this._emitStage('degradation', {});
      }

      // Gradually increase failure multipliers
      dp.setFailureMultipliers({
        vibration: 1.0 + progress * 1.5,   // up to 2.5x
        temperature: 1.0 + progress * 0.4,  // up to 1.4x
        motorCurrent: 1.0 + progress * 0.6, // up to 1.6x
      });

      // Joint 3 transitions to WARNING
      const risk = Math.round(10 + progress * 50); // 10→60%
      dp.setJointState(FAILURE_JOINT_ID, 'WARNING', risk);

      return;
    }

    // ========================================
    // Stage 3: Critical (9–13s)
    // ========================================
    if (t < 13) {
      const progress = (t - 9) / 4; // 0→1 over 4s
      
      if (this._currentStage !== 'critical') {
        this._currentStage = 'critical';
        this._emitStage('critical', {});
      }

      // High failure multipliers
      dp.setFailureMultipliers({
        vibration: 2.5 + progress * 1.0,    // up to 3.5x
        temperature: 1.4 + progress * 0.3,   // up to 1.7x
        motorCurrent: 1.6 + progress * 0.6,  // up to 2.2x
      });

      // Joint 3 → CRITICAL, risk climbing to 94%
      const risk = Math.round(60 + progress * 34); // 60→94%
      dp.setJointState(FAILURE_JOINT_ID, 'CRITICAL', risk);

      return;
    }

    // ========================================
    // Stage 4: Safety Interlock (13s+)
    // ========================================
    if (this._currentStage !== 'emergency') {
      this._currentStage = 'emergency';

      // Final values
      dp.setJointState(FAILURE_JOINT_ID, 'CRITICAL', 94);
      dp.setEmergencyStop(true);

      this._emitStage('emergency', {
        jointId: FAILURE_JOINT_ID,
        jointName: 'Joint 3',
        riskPercent: 94,
      });

      // Simulation ends — stays in emergency state until reset
      this._running = false;
    }
  }

  /**
   * Reset the system to healthy baseline.
   */
  reset() {
    this._running = false;
    this._elapsed = 0;
    this._currentStage = 'idle';
    this._dataProvider.reset();
    this._emitStage('reset', {});
  }

  _emitStage(stage, data) {
    if (this._onStageChange) {
      this._onStageChange(stage, data);
    }
  }
}
