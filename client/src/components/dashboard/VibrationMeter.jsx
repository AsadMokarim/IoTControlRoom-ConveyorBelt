import React from 'react';

const VibrationMeter = ({ value }) => {
  const numVal = Number(value ?? 0);
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const percentage = clamp(numVal, 0, 10) / 10;
  const activeBars = Math.ceil(percentage * 12);

  let statusText = 'NORMAL VIB';
  let statusColor = 'var(--primary, #4edea3)';
  if (numVal === 0) {
    statusText = 'REST / IDLE';
    statusColor = 'var(--on-surface-variant, #bbcabf)';
  } else if (numVal >= 5.0) {
    statusText = 'HIGH SHOCK';
    statusColor = 'var(--error, #ffb4ab)';
  } else if (numVal >= 2.5) {
    statusText = 'ELEVATED';
    statusColor = 'var(--tertiary, #ffb95f)';
  }

  return (
    <div className="widget meter-widget" id="vibration-widget">
      <div className="widget-title">
        <span className="label-caps">RMS Vibration</span>
        <span className="widget-icon"></span>
      </div>

      <div className="audio-meter" id="vibration-meter">
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
        <strong id="rms-vibration" className="display-process-val">{numVal.toFixed(2)}</strong>
        <small className="subhead-tag">g-RMS / mm/s</small>
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

export default VibrationMeter;
