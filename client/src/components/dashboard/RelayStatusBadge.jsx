import React from 'react';

export const RelayStatusBadge = ({ relayState, isLive, isWsConnected }) => {
  const isTripped = relayState?.state === 'TRIPPED' || relayState?.trip_triggered;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {/* Live / Demo Mode Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          background: isLive
            ? 'rgba(34, 197, 94, 0.15)'
            : 'rgba(234, 179, 8, 0.15)',
          color: isLive ? '#22c55e' : '#eab308',
          border: `1px solid ${isLive ? 'rgba(34, 197, 94, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`,
        }}
        title={isLive ? 'Receiving real-time ESP32 telemetry' : 'Hardware offline - showing live simulation'}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isLive ? '#22c55e' : '#eab308',
            boxShadow: isLive ? '0 0 8px #22c55e' : 'none',
          }}
        />
        {isLive ? 'LIVE (MQTT)' : 'DEMO (SIM)'}
      </div>

      {/* WebSocket Status Indicator */}
      <span
        style={{
          fontSize: '0.7rem',
          color: isWsConnected ? 'rgba(148, 163, 184, 0.8)' : '#f87171',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
        title={isWsConnected ? 'WebSocket connected' : 'WebSocket reconnecting (HTTP fallback active)'}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isWsConnected ? '#38bdf8' : '#ef4444',
          }}
        />
        {isWsConnected ? 'WS' : 'POLL'}
      </span>

      {/* Motor Relay Circuit Status */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '0.78rem',
          fontWeight: 700,
          background: isTripped
            ? 'rgba(239, 68, 68, 0.2)'
            : 'rgba(56, 189, 248, 0.15)',
          color: isTripped ? '#ef4444' : '#38bdf8',
          border: `1px solid ${isTripped ? '#ef4444' : 'rgba(56, 189, 248, 0.4)'}`,
          animation: isTripped ? 'pulse 1.5s infinite' : 'none',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isTripped ? '#ef4444' : '#38bdf8',
            boxShadow: isTripped ? '0 0 10px #ef4444' : '0 0 6px #38bdf8',
          }}
        />
        {isTripped
          ? `CIRCUIT TRIPPED (${relayState?.trip_reason || 'CUTOFF'})`
          : 'MOTOR RUNNING'}
      </div>
    </div>
  );
};

export default RelayStatusBadge;
