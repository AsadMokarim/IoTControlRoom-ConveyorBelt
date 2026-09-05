/**
 * alerts.js
 * 
 * Emergency stop overlay and critical failure banner.
 * Appears when failure probability exceeds 90%.
 * 
 * Displays:
 *  - CRITICAL FAILURE PREDICTED
 *  - Affected joint and risk percentage
 *  - SAFETY INTERLOCK ACTIVE
 *  - MOTOR POWER CUT
 */

let alertOverlay = null;
let alertContent = null;
let isVisible = false;

/**
 * Initialize alert elements.
 */
export function initAlerts() {
  alertOverlay = document.getElementById('alert-overlay');
  alertContent = document.getElementById('alert-content');
}

/**
 * Show the critical failure alert.
 * @param {Object} data - { jointName, riskPercent }
 */
export function showCriticalAlert(data) {
  if (!alertOverlay || isVisible) return;

  const { jointName = 'Joint 3', riskPercent = 94 } = data;

  alertContent.innerHTML = `
    <div class="alert-icon">⚠</div>
    <h2 class="alert-title">CRITICAL FAILURE PREDICTED</h2>
    <div class="alert-divider"></div>
    <div class="alert-detail">
      <span class="alert-joint">${jointName}</span>
      <span class="alert-risk">Failure Probability: ${riskPercent}%</span>
    </div>
    <div class="alert-divider"></div>
    <div class="alert-interlock">
      <div class="alert-interlock-label">SAFETY INTERLOCK</div>
      <div class="alert-interlock-status">ACTIVE</div>
    </div>
    <div class="alert-motor">
      <span class="alert-motor-icon">⏻</span>
      MOTOR POWER CUT
    </div>
  `;

  alertOverlay.classList.add('visible');
  isVisible = true;
}

/**
 * Hide the critical failure alert.
 */
export function hideCriticalAlert() {
  if (!alertOverlay) return;
  alertOverlay.classList.remove('visible');
  isVisible = false;
}

export function isAlertVisible() {
  return isVisible;
}
