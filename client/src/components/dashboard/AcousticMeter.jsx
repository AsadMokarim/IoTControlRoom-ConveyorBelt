import React from 'react';

const AcousticMeter = ({ value }) => {
  const numVal = Number(value) || 0;
  // Map 30 dB - 110 dB to percentage
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const percentage = clamp(numVal - 30, 0, 80) / 80;
  const activeBars = Math.ceil(percentage * 12);

  let statusText = 'Normal';
  let statusColor = '#38bdf8';
  if (numVal >= 88) {
    statusText = 'Critical Noise';
    statusColor = '#ef4444';
  } else if (numVal >= 75) {
    statusText = 'Elevated';
    statusColor = '#facc15';
  }

  return (
    <div className="widget meter-widget" id="acoustic-widget">
      <div className="widget-title">
        <span>Acoustic Sensor</span>
        <span className="widget-icon">🔊</span>
      </div>

      <div className="audio-meter" id="acoustic-meter">
        {Array.from({ length: 12 }).map((_, index) => {
          const isActive = index < activeBars;
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
        <strong id="acoustic-db">{numVal ? numVal.toFixed(1) : '--'}</strong>
        <small>dB SPL</small>
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '4px', color: statusColor, fontWeight: 600 }}>
        {statusText}
      </div>
    </div>
  );
};

export default AcousticMeter;
