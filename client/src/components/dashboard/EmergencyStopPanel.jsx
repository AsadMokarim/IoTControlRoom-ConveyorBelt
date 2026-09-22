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
      className="panel"
      style={{
        border: isTripped ? '1px solid #ef4444' : '1px solid var(--panel-border, rgba(148, 163, 184, 0.2))',
        background: isTripped
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(30, 41, 59, 0.95) 100%)'
          : 'var(--panel, #1e293b)',
        padding: '16px 20px',
        borderRadius: '8px',
        marginBottom: '20px',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, color: 'var(--text, #e2e8f0)' }}>
              Hardware Motor Control & Auto-Cutoff
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: isTripped ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                color: isTripped ? '#ef4444' : '#22c55e',
              }}
            >
              {isTripped ? 'RELAY OPEN (TRIPPED)' : 'RELAY CLOSED (ARMED)'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--muted, #94a3b8)' }}>
            {isTripped
              ? `Safety cut-off active: ${relayState?.trip_reason || 'Unknown cause'}${relayState?.tripped_at ? ` at ${relayState.tripped_at}` : ''}`
              : 'Direct MQTT safety circuit to ESP32 relay GPIO 26. Immediate autonomous shutoff on threshold breach.'}
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {!isTripped && (
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'rgba(15, 23, 42, 0.7)',
                color: 'var(--text, #e2e8f0)',
                border: '1px solid var(--border, #334155)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <option value="EMERGENCY_STOP">Reason: Manual E-Stop</option>
              <option value="CONVEYOR_JAM">Reason: Belt Jam Detected</option>
              <option value="THERMAL_OVERHEAT">Reason: Motor Overheating</option>
              <option value="MAINTENANCE_HOLD">Reason: Scheduled Hold</option>
            </select>
          )}

          {/* E-Stop Button */}
          <button
            onClick={handleCutoffClick}
            disabled={isPending || isTripped}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              background: isTripped ? 'rgba(100, 116, 139, 0.3)' : '#dc2626',
              color: '#ffffff',
              border: isTripped ? '1px solid #475569' : '1px solid #ef4444',
              fontWeight: 800,
              fontSize: '0.88rem',
              letterSpacing: '0.04em',
              cursor: isTripped || isPending ? 'not-allowed' : 'pointer',
              boxShadow: isTripped ? 'none' : '0 0 14px rgba(239, 68, 68, 0.4)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🛑</span>
            {isPending ? 'TRANSMITTING...' : 'EMERGENCY STOP'}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetClick}
            disabled={isPending || !isTripped}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              background: isTripped ? '#16a34a' : 'rgba(100, 116, 139, 0.2)',
              color: isTripped ? '#ffffff' : 'rgba(148, 163, 184, 0.5)',
              border: isTripped ? '1px solid #22c55e' : '1px solid #334155',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: !isTripped || isPending ? 'not-allowed' : 'pointer',
              boxShadow: isTripped ? '0 0 12px rgba(34, 197, 94, 0.35)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🔄</span>
            RESET & REARM
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyStopPanel;
