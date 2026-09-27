import React from 'react';

export const RelayStatusBadge = ({ relayState, isLive, isWsConnected }) => {
  const isTripped = relayState?.state === 'TRIPPED' || relayState?.trip_triggered;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {/* Live / Demo Mode Badge */}
      <div
        className="alarm-annunciator"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: 'var(--rounded-sm, 0.125rem)',
          background: isLive ? 'var(--on-primary, #003824)' : 'var(--on-tertiary, #472a00)',
          color: isLive ? 'var(--primary, #4edea3)' : 'var(--tertiary, #ffb95f)',
          border: `1px solid ${isLive ? 'var(--primary-container, #10b981)' : 'var(--tertiary-container, #e29100)'}`,
        }}
        title={isLive ? 'Receiving real-time ESP32 telemetry' : 'Hardware offline - showing simulated stream'}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '1px',
            background: isLive ? 'var(--primary, #4edea3)' : 'var(--tertiary, #ffb95f)',
          }}
        />
        {isLive ? 'LINK: MQTT LIVE' : 'LINK: SIMULATED'}
      </div>

      {/* WebSocket Status Indicator */}
      <span
        className="label-caps"
        style={{
          color: isWsConnected ? 'var(--on-surface-variant, #bbcabf)' : 'var(--error, #ffb4ab)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--surface-container-high, #252a31)',
          padding: '4px 6px',
          borderRadius: 'var(--rounded-sm, 0.125rem)',
          border: '1px solid var(--outline-variant, #3c4a42)',
        }}
        title={isWsConnected ? 'WebSocket connected' : 'WebSocket polling fallback'}
      >
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '1px',
            background: isWsConnected ? 'var(--primary, #4edea3)' : 'var(--error, #ffb4ab)',
          }}
        />
        {isWsConnected ? 'WS OK' : 'HTTP POLL'}
      </span>

      {/* Motor Relay Circuit Status */}
      {/* <div
        className="alarm-annunciator"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--rounded-sm, 0.125rem)',
          background: isTripped ? 'var(--on-error, #690005)' : 'var(--surface-container-high, #252a31)',
          color: isTripped ? 'var(--error, #ffb4ab)' : 'var(--secondary, #adc6ff)',
          border: `1px solid ${isTripped ? 'var(--error-container, #93000a)' : 'var(--outline-variant, #3c4a42)'}`,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '1px',
            background: isTripped ? 'var(--error, #ffb4ab)' : 'var(--secondary, #adc6ff)',
          }}
        />
        {isTripped
          ? `TRIP: ${relayState?.trip_reason || 'INTERLOCK'}`
          : 'CIRCUIT CLOSED'}
      </div> */}
    </div>
  );
};

export default RelayStatusBadge;
