import React from 'react';

const CurrentMeter = ({ value }) => {
  const numVal = Number(value ?? 0);
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const percentage = clamp(numVal, 0, 25) / 25;
  const activeBars = Math.ceil(percentage * 12);

  let statusText = 'NORMAL DRAW';
  let statusColor = 'var(--primary, #4edea3)';

  if (numVal === 0) {
    statusText = 'CIRCUIT OPEN / 0A';
    statusColor = 'var(--on-surface-variant, #bbcabf)';
  } else if (numVal >= 20) {
    statusText = 'OVERCURRENT';
    statusColor = 'var(--error, #ffb4ab)';
  } else if (numVal >= 12) {
    statusText = 'HIGH LOAD';
    statusColor = 'var(--tertiary, #ffb95f)';
  }

  return (
    <div className="widget meter-widget" id="current-widget">
      <div className="widget-title">
        <span className="label-caps">Motor Current</span>
        <span className="widget-icon"></span>
      </div>

      <div className="audio-meter" id="current-meter">
        {Array.from({ length: 12 }).map((_, index) => {
          const isActive = numVal > 0 && index < activeBars;
          let background = '';
          if (isActive) {
            if (index >= 9) background = 'var(--error, #ffb4ab)';
            else if (index >= 6) background = 'var(--tertiary, #ffb95f)';
            else background = 'var(--primary, #4edea3)';
          }

          return (
            <span
              key={index}
              style={{
                opacity: isActive ? 1 : 0.15,
                background: background || undefined,
              }}
            />
          );
        })}
      </div>

      <div className="meter-value">
        <strong id="motor-current-display" className="display-process-val">{numVal.toFixed(2)}</strong>
        <small className="subhead-tag">Amperes (A)</small>
      </div>

      <div
        className="alarm-annunciator"
        style={{
          textAlign: 'center',
          marginTop: '6px',
          color: statusColor,
          letterSpacing: '0.06em',
        }}
      >
        {statusText}
      </div>
    </div>
  );
};

export default CurrentMeter;
