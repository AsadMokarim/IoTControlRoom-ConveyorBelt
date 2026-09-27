import React from 'react';

export default function TwinAlertOverlay({ isActive, onDismiss, alertData }) {
  if (!isActive) return null;

  const reason = alertData?.reason || 'Critical Safety Threshold Exceeded — Safety Relay Trip Activated';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 15, 20, 0.88)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      animation: 'fadeInOverlay 0.2s ease',
      fontFamily: 'var(--font-inter)',
    }}>
      <div style={{
        background: 'var(--surface-container, #1b2026)',
        border: '1px solid var(--error, #ffb4ab)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
        borderRadius: 'var(--rounded, 0.25rem)',
        padding: '24px 28px',
        textAlign: 'center',
        maxWidth: '440px',
        width: '90%',
        animation: 'scaleIn 0.2s ease',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px', lineHeight: 1 }}>⚡</div>
        <div className="alarm-annunciator" style={{ fontSize: '15px', color: 'var(--error, #ffb4ab)', marginBottom: '6px' }}>
          AUTOMATIC MOTOR INTERLOCK ENGAGED
        </div>
        <p className="body-dense" style={{ color: 'var(--on-surface-variant, #bbcabf)', margin: '0 0 16px 0' }}>
          {reason}
        </p>

        <div style={{ height: '1px', background: 'var(--outline-variant, #3c4a42)', margin: '14px 0' }} />

        <div style={{ marginBottom: '16px' }}>
          <div className="label-caps" style={{ color: 'var(--on-surface-variant, #bbcabf)', marginBottom: '4px' }}>
            CONVEYOR BREAKER STATUS
          </div>
          <div className="alarm-annunciator" style={{ fontSize: '16px', color: 'var(--error, #ffb4ab)' }}>
            ⛔ RELAY OPEN (TRIPPED)
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="alarm-annunciator"
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--rounded-sm, 0.125rem)',
            background: 'var(--on-primary, #003824)',
            color: 'var(--primary, #4edea3)',
            border: '1px solid var(--primary-container, #10b981)',
            cursor: 'pointer',
            fontSize: '12px',
            width: '100%',
            transition: 'all 0.15s ease',
          }}
        >
          CLEAR INTERLOCK & RESTORE SYSTEM
        </button>
      </div>

      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
