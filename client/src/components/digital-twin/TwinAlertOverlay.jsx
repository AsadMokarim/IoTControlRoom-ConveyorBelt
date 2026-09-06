import React from 'react';

export default function TwinAlertOverlay({ isActive, onDismiss, alertData }) {
  if (!isActive) return null;

  const jointName = alertData?.jointName || 'Joint 3 (Splice C)';
  const riskPercent = alertData?.riskPercent || 96;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 14, 23, 0.88)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      animation: 'fadeInOverlay 0.4s ease',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(239, 68, 68, 0.2)',
        borderRadius: '16px',
        padding: '36px 44px',
        textAlign: 'center',
        maxWidth: '440px',
        width: '90%',
        animation: 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px', lineHeight: 1 }}>⚡</div>
        <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '2px', color: '#ef4444', marginBottom: '8px' }}>
          EMERGENCY STOP ACTIVATED
        </div>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>
          Critical failure threshold reached — Safety Interlock Engaged
        </p>

        <div style={{ height: '1px', background: 'rgba(100, 116, 139, 0.2)', margin: '16px 0' }} />

        <div style={{ marginBottom: '16px', background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(100,116,139,0.15)' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>{jointName}</div>
          <div style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", color: '#ef4444', fontWeight: 700 }}>
            RISK SCORE: {riskPercent}%
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
            CONVEYOR MOTOR STATUS
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#ef4444', letterSpacing: '2px' }}>
            ⛔ STOPPED (TRIPPED)
          </div>
        </div>

        <button
          onClick={onDismiss}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            width: '100%',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          Reset System & Restart
        </button>
      </div>

      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
