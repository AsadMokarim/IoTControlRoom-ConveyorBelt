import React from 'react';

const TemperatureGauge = ({ title, icon, value, id }) => {
  const clamp = (val, min, max) => Math.min(Math.max(Number(val) || 0, min), max);
  const percentage = clamp(value, 0, 100) / 100;
  const degrees = `${percentage * 270}deg`;
  
  let color = "var(--primary, #4edea3)";
  if (value >= 80) color = "var(--error, #ffb4ab)";
  else if (value >= 65) color = "var(--tertiary, #ffb95f)";

  return (
    <div className="widget gauge-widget">
      <div className="widget-title">
        <span className="label-caps">{title}</span>
        <span className="widget-icon">{icon}</span>
      </div>

      <div
        className="gauge"
        id={`${id}-gauge`}
        style={{ "--value": degrees, "--gauge-color": color }}
      >
        <div className="gauge-inner">
          <strong id={id} className="display-process-val">{value ? value.toFixed(1) : '--'}</strong>
          <small className="subhead-tag">°C</small>
        </div>
      </div>

      <div className="scale telemetry-data">
        <span>0°C</span>
        <span>50°C</span>
        <span>100°C</span>
      </div>
    </div>
  );
};

export default TemperatureGauge;
