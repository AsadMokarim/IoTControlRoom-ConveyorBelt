import React from 'react';

const TemperatureGauge = ({ title, icon, value, id }) => {
  const clamp = (val, min, max) => Math.min(Math.max(Number(val) || 0, min), max);
  const percentage = clamp(value, 0, 100) / 100;
  const degrees = `${percentage * 270}deg`;
  
  let color = "#38bdf8";
  if (value >= 85) color = "#ef4444";
  else if (value >= 70) color = "#facc15";

  return (
    <div className="widget gauge-widget">
        <div className="widget-title">
            <span>{title}</span>
            <span className="widget-icon">{icon}</span>
        </div>

        <div className="gauge"
             id={`${id}-gauge`}
             style={{ "--value": degrees, "--gauge-color": color }}>
            <div className="gauge-inner">
                <strong id={id}>{value ? value.toFixed(1) : '--'}</strong>
                <small>°C</small>
            </div>
        </div>

        <div className="scale">
            <span>0</span>
            <span>50</span>
            <span>100</span>
        </div>
    </div>
  );
};

export default TemperatureGauge;
