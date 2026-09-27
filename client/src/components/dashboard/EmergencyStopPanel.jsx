import React, { useState } from 'react';

const EmergencyStopPanel = ({ relayState, onCutoff, onReset, isPending }) => {
  const [selectedReason, setSelectedReason] = useState('EMERGENCY_STOP');
  const isTripped = relayState?.state === 'TRIPPED' || relayState?.trip_triggered;

  const handleCutoffClick = () => {
    if (onCutoff) {
      onCutoff(selectedReason);
    }
  };

  const handleResetClick = () => {
    if (onReset) {
      onReset();
    }
  };

  return (
    <div
      className="panel scada-mcc-panel"
      style={{
        border: isTripped ? '1px solid var(--error, #ffb4ab)' : '1px solid var(--outline-variant, #3c4a42)',
        background: isTripped ? 'var(--surface-container-high, #252a31)' : 'var(--surface-container, #1b2026)',
        padding: '12px 16px',
        borderRadius: 'var(--rounded, 0.25rem)',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className="headline-panel" style={{ margin: 0, color: 'var(--on-surface)' }}>
              Hardware Motor Safety Breaker & Relay
            </h2>
            <span
              className="alarm-annunciator"
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--rounded-sm, 0.125rem)',
                background: isTripped ? 'var(--on-error, #690005)' : 'var(--on-primary, #003824)',
                color: isTripped ? 'var(--error, #ffb4ab)' : 'var(--primary, #4edea3)',
                border: `1px solid ${isTripped ? 'var(--error-container, #93000a)' : 'var(--primary-container, #10b981)'}`,
              }}
            >
              {isTripped ? 'RELAY TRIPPED / MOTOR HALTED' : 'MOTOR ACTIVE'}
            </span>
          </div>
          {/* <p className="body-dense" style={{ margin: '4px 0 0', color: 'var(--on-surface-variant)' }}>
            {isTripped
              ? `Trip condition active: ${relayState?.trip_reason || 'Manual Emergency Stop'}${relayState?.tripped_at ? ` at ${relayState.tripped_at}` : ''} | MQTT topic: conveyor/control`
              : 'Direct safety relay contact via MQTT conveyor/control topic. Publishes "STOP" to trip circuit breaker and "START" to clear interlock.'}
          </p> */}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {!isTripped && (
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="telemetry-data"
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--rounded-sm, 0.125rem)',
                background: 'var(--surface-container-high, #252a31)',
                color: 'var(--on-surface, #dee3eb)',
                border: '1px solid var(--outline-variant, #3c4a42)',
                cursor: 'pointer',
              }}
            >
              <option value="EMERGENCY_STOP">Reason: Manual Operator E-Stop</option>
              <option value="CONVEYOR_JAM">Reason: Mechanical Belt Jam</option>
              <option value="THERMAL_OVERHEAT">Reason: Bearing/Motor Overheat</option>
              <option value="MAINTENANCE_HOLD">Reason: Inspection Lockout</option>
            </select>
          )}

          {/* E-Stop Button */}
          <button
            onClick={handleCutoffClick}
            disabled={isPending || isTripped}
            title='Publishes "STOP" to conveyor/control'
            className="alarm-annunciator"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--rounded-sm, 0.125rem)',
              background: isTripped ? 'var(--surface-container-highest, #30353c)' : 'var(--error-container, #93000a)',
              color: isTripped ? 'var(--outline, #86948a)' : 'var(--error, #ffb4ab)',
              border: `1px solid ${isTripped ? 'var(--outline-variant, #3c4a42)' : 'var(--error, #ffb4ab)'}`,
              cursor: isTripped || isPending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{isPending ? 'TRANSMITTING...' : 'EMERGENCY TRIP (STOP)'}</span>
          </button>

          {/* Reset & Start Button */}
          <button
            onClick={handleResetClick}
            disabled={isPending || !isTripped}
            title='Publishes "START" to conveyor/control'
            className="alarm-annunciator"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--rounded-sm, 0.125rem)',
              background: isTripped ? 'var(--on-primary, #003824)' : 'var(--surface-container-highest, #30353c)',
              color: isTripped ? 'var(--primary, #4edea3)' : 'var(--outline, #86948a)',
              border: `1px solid ${isTripped ? 'var(--primary-container, #10b981)' : 'var(--outline-variant, #3c4a42)'}`,
              cursor: !isTripped || isPending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>CLEAR INTERLOCK (START)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyStopPanel;
