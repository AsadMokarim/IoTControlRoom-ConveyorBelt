import React from 'react';

const AlertRing = ({ count }) => {
  const countNum = Number(count) || 0;
  const ringPercentage = countNum === 0 ? 100 : Math.max(15, 100 - countNum * 18);
  const degrees = ringPercentage * 3.6;

  let background = '';
  let summaryText = '';

  if (countNum === 0) {
      background = `
          conic-gradient(
              #22c55e 0deg,
              #22c55e ${degrees}deg,
              rgba(255,255,255,0.08) ${degrees}deg
          )
      `;
      summaryText = "System monitoring normally";
  } else {
      background = `
          conic-gradient(
              #ef4444 0deg,
              #ef4444 ${degrees}deg,
              rgba(255,255,255,0.08) ${degrees}deg
          )
      `;
      summaryText = `${countNum} alert${countNum === 1 ? "" : "s"} require attention`;
  }

  return (
    <div className="widget alert-widget">
        <div className="widget-title">
            <span>Active Alerts</span>
            <span className="widget-icon">⚠</span>
        </div>

        <div className="alert-ring" id="alert-ring" style={{ background }}>
            <div>
                <strong id="active-alerts">{countNum}</strong>
                <small>ACTIVE</small>
            </div>
        </div>

        <div id="alert-summary">{summaryText}</div>
    </div>
  );
};

export default AlertRing;
