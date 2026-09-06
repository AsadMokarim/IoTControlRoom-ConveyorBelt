import React from 'react';

const VibrationMeter = ({ value }) => {
  const clamp = (val, min, max) => Math.min(Math.max(Number(val) || 0, min), max);
  const percentage = clamp(value, 0, 20) / 20;
  const activeBars = Math.ceil(percentage * 12);

  return (
    <div className="widget meter-widget">
        <div className="widget-title">
            <span>RMS Vibration</span>
            <span className="widget-icon">〽</span>
        </div>

        <div className="audio-meter" id="vibration-meter">
            {Array.from({ length: 12 }).map((_, index) => {
                const isActive = index < activeBars;
                let background = '';
                if (isActive) {
                    if (value >= 15) background = '#ef4444';
                    else if (value >= 8) background = '#facc15';
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
            <strong id="rms-vibration">{value ? value.toFixed(2) : '--'}</strong>
            <small>mm/s</small>
        </div>
    </div>
  );
};

export default VibrationMeter;
