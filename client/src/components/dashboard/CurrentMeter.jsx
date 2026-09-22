import React from 'react';

const CurrentMeter = ({ value }) => {
  const numVal = Number(value ?? 0);
  // Scale 0A - 25A across 12 LED segments
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const percentage = clamp(numVal, 0, 25) / 25;
  const activeBars = Math.ceil(percentage * 12);

  let statusText = 'Normal Load';
  let statusColor = '#38bdf8';

  if (numVal === 0) {
    statusText = 'Motor Idle / Off';
    statusColor = '#94a3b8';
  } else if (numVal >= 20) {
    statusText = 'Overload Warning';
    statusColor = '#ef4444';
  } else if (numVal >= 12) {
    statusText = 'Heavy Load';
    statusColor = '#facc15';
  }

  return (
    <div className="widget meter-widget" id="current-widget">
      <div className="widget-title">
        <span>Motor Current</span>
        <span className="widget-icon">⚡</span>
      </div>

      <div className="audio-meter" id="current-meter">
        {Array.from({ length: 12 }).map((_, index) => {
          const isActive = numVal > 0 && index < activeBars;
          let background = '';
          if (isActive) {
            if (index >= 9) background = '#ef4444';
            else if (index >= 6) background = '#facc15';
            else background = '#38bdf8';
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
        <strong id="motor-current-display">{numVal.toFixed(2)}</strong>
        <small>Amperes</small>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '4px', color: statusColor, fontWeight: 600 }}>
        {statusText}
      </div>
    </div>
  );
};

export default CurrentMeter;
