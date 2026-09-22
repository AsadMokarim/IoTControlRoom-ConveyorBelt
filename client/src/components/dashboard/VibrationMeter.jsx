import React from 'react';

const VibrationMeter = ({ value }) => {
  const numVal = Number(value ?? 0);
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const percentage = clamp(numVal, 0, 10) / 10;
  const activeBars = Math.ceil(percentage * 12);

  let statusText = 'Normal';
  let statusColor = '#38bdf8';
  if (numVal === 0) {
    statusText = 'Smooth / Rest';
    statusColor = '#94a3b8';
  } else if (numVal >= 5.0) {
    statusText = 'Critical Shock';
    statusColor = '#ef4444';
  } else if (numVal >= 2.5) {
    statusText = 'Elevated Shock';
    statusColor = '#facc15';
  }

  return (
    <div className="widget meter-widget" id="vibration-widget">
        <div className="widget-title">
            <span>Vibration / Shock</span>
            <span className="widget-icon">〽</span>
        </div>

        <div className="audio-meter" id="vibration-meter">
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
                            background: background || undefined 
                        }} 
                    />
                );
            })}
        </div>

        <div className="meter-value">
            <strong id="rms-vibration">{numVal.toFixed(2)}</strong>
            <small>g / mm/s</small>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '4px', color: statusColor, fontWeight: 600 }}>
          {statusText}
        </div>
    </div>
  );
};

export default VibrationMeter;
