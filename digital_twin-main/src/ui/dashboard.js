/**
 * dashboard.js
 * 
 * Updates the sensor data panel, system health badge, joint status list,
 * and selected joint detail view.
 * 
 * All DOM references are cached at initialization for performance.
 */

const STATE_LABELS = {
  NORMAL: 'HEALTHY',
  WARNING: 'DEGRADING',
  CRITICAL: 'CRITICAL',
};

const STATE_CSS = {
  NORMAL: 'status-normal',
  WARNING: 'status-warning',
  CRITICAL: 'status-critical',
};

let elements = {};
let selectedJointId = null;
let onJointClickCallback = null;

/**
 * Initialize the dashboard by caching DOM references.
 */
export function initDashboard() {
  elements = {
    // System health
    healthBadge: document.getElementById('health-badge'),
    healthLabel: document.getElementById('health-label'),

    // Sensor readings
    vibration: document.getElementById('val-vibration'),
    temperature: document.getElementById('val-temperature'),
    motorCurrent: document.getElementById('val-motor-current'),
    beltSpeed: document.getElementById('val-belt-speed'),
    failureProb: document.getElementById('val-failure-prob'),

    // Joint status indicators
    jointItems: [
      document.getElementById('joint-item-1'),
      document.getElementById('joint-item-2'),
      document.getElementById('joint-item-3'),
      document.getElementById('joint-item-4'),
    ],
    jointDots: [
      document.getElementById('joint-dot-1'),
      document.getElementById('joint-dot-2'),
      document.getElementById('joint-dot-3'),
      document.getElementById('joint-dot-4'),
    ],
    jointRisks: [
      document.getElementById('joint-risk-1'),
      document.getElementById('joint-risk-2'),
      document.getElementById('joint-risk-3'),
      document.getElementById('joint-risk-4'),
    ],

    // Selected joint detail
    jointDetail: document.getElementById('joint-detail'),
    jointDetailName: document.getElementById('joint-detail-name'),
    jointDetailState: document.getElementById('joint-detail-state'),
    jointDetailRisk: document.getElementById('joint-detail-risk'),
    jointDetailVibration: document.getElementById('joint-detail-vibration'),

    // Motor / system
    motorStatus: document.getElementById('val-motor-status'),
    systemStatus: document.getElementById('system-status-text'),
  };

  // Wire up joint item clicks
  for (let i = 0; i < 4; i++) {
    const item = elements.jointItems[i];
    if (item) {
      item.addEventListener('click', () => {
        if (onJointClickCallback) {
          onJointClickCallback(`joint_${i + 1}`);
        }
      });
    }
  }
}

/**
 * Register a callback for when a joint is clicked in the dashboard.
 */
export function onDashboardJointClick(callback) {
  onJointClickCallback = callback;
}

/**
 * Update the dashboard with new data.
 */
export function updateDashboard(sensorData, jointStates, systemState) {
  // --- System health badge ---
  if (elements.healthBadge) {
    elements.healthBadge.className = `health-badge ${STATE_CSS[systemState.systemHealth]}`;
  }
  if (elements.healthLabel) {
    elements.healthLabel.textContent = STATE_LABELS[systemState.systemHealth] || systemState.systemHealth;
  }

  // --- Sensor readings ---
  if (elements.vibration) {
    elements.vibration.textContent = sensorData.vibration.toFixed(2);
  }
  if (elements.temperature) {
    elements.temperature.textContent = sensorData.temperature.toFixed(1);
  }
  if (elements.motorCurrent) {
    elements.motorCurrent.textContent = sensorData.motorCurrent.toFixed(2);
  }
  if (elements.beltSpeed) {
    elements.beltSpeed.textContent = sensorData.beltSpeed.toFixed(2);
  }
  if (elements.failureProb) {
    elements.failureProb.textContent = `${Math.round(systemState.failureProbability)}%`;
    elements.failureProb.className = systemState.failureProbability > 70
      ? 'val-highlight-critical'
      : systemState.failureProbability > 40
        ? 'val-highlight-warning'
        : '';
  }

  // --- Motor status ---
  if (elements.motorStatus) {
    elements.motorStatus.textContent = systemState.motorRunning ? 'RUNNING' : 'STOPPED';
    elements.motorStatus.className = systemState.motorRunning ? 'val-running' : 'val-stopped';
  }

  // --- Joint status list ---
  for (let i = 0; i < 4; i++) {
    const jState = jointStates[i];
    if (elements.jointDots[i]) {
      elements.jointDots[i].className = `joint-dot ${STATE_CSS[jState.state]}`;
    }
    if (elements.jointRisks[i]) {
      elements.jointRisks[i].textContent = `${jState.riskPercent}%`;
    }
    // Highlight selected
    if (elements.jointItems[i]) {
      elements.jointItems[i].classList.toggle('selected', jState.id === selectedJointId);
    }
  }

  // --- Selected joint detail ---
  if (selectedJointId) {
    const jState = jointStates.find(j => j.id === selectedJointId);
    if (jState && elements.jointDetail) {
      elements.jointDetail.classList.add('visible');
      if (elements.jointDetailName) {
        elements.jointDetailName.textContent = `Joint ${jState.id.split('_')[1]}`;
      }
      if (elements.jointDetailState) {
        elements.jointDetailState.textContent = STATE_LABELS[jState.state];
        elements.jointDetailState.className = `detail-state ${STATE_CSS[jState.state]}`;
      }
      if (elements.jointDetailRisk) {
        elements.jointDetailRisk.textContent = `${jState.riskPercent}%`;
      }
      if (elements.jointDetailVibration) {
        elements.jointDetailVibration.textContent = `${sensorData.vibration.toFixed(2)} g`;
      }
    }
  }

  // --- System status text ---
  if (elements.systemStatus) {
    if (systemState.emergencyStop) {
      elements.systemStatus.textContent = 'EMERGENCY STOP';
      elements.systemStatus.className = 'system-status-text status-critical';
    } else {
      elements.systemStatus.textContent = 'SYSTEM RUNNING';
      elements.systemStatus.className = 'system-status-text status-normal';
    }
  }
}

/**
 * Set the selected joint (called from 3D raycasting or dashboard click).
 */
export function selectJoint(jointId) {
  selectedJointId = jointId;

  if (!jointId && elements.jointDetail) {
    elements.jointDetail.classList.remove('visible');
  }
}

/**
 * Get the currently selected joint ID.
 */
export function getSelectedJointId() {
  return selectedJointId;
}
