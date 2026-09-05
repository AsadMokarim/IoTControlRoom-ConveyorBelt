/**
 * twinStatus.js
 * 
 * Digital Twin synchronization status widget.
 * Shows the physical ↔ digital relationship prominently
 * so judges immediately understand the digital-twin concept.
 * 
 * Displays:
 *  - DIGITAL TWIN ● SYNCHRONIZED
 *  - Physical System: RUNNING / STOPPED
 *  - Virtual System:  RUNNING / STOPPED
 *  - Last update timestamp
 */

let elements = {};

/**
 * Initialize the twin status widget.
 */
export function initTwinStatus() {
  elements = {
    syncDot: document.getElementById('twin-sync-dot'),
    syncLabel: document.getElementById('twin-sync-label'),
    lastUpdate: document.getElementById('twin-last-update'),
    physicalState: document.getElementById('twin-physical-state'),
    virtualState: document.getElementById('twin-virtual-state'),
  };
}

/**
 * Update the digital twin status display.
 * @param {Object} systemState
 */
export function updateTwinStatus(systemState) {
  const isRunning = systemState.motorRunning;
  const stateText = isRunning ? 'RUNNING' : 'STOPPED';
  const stateClass = isRunning ? 'twin-running' : 'twin-stopped';

  // Sync indicator
  if (elements.syncDot) {
    elements.syncDot.className = `sync-dot ${systemState.syncStatus === 'SYNCHRONIZED' ? 'synced' : 'disconnected'}`;
  }
  if (elements.syncLabel) {
    elements.syncLabel.textContent = systemState.syncStatus;
  }

  // Last update
  if (elements.lastUpdate) {
    const ms = systemState.lastUpdateMs || 0;
    elements.lastUpdate.textContent = `${(ms / 1000).toFixed(1)}s ago`;
  }

  // Physical ↔ Digital state (side by side)
  if (elements.physicalState) {
    elements.physicalState.textContent = stateText;
    elements.physicalState.className = `twin-state-value ${stateClass}`;
  }
  if (elements.virtualState) {
    elements.virtualState.textContent = stateText;
    elements.virtualState.className = `twin-state-value ${stateClass}`;
  }
}
