import React from 'react';

const AlertRing = ({ count }) => {
  const countNum = Number(count) || 0;
  const ringPercentage = countNum === 0 ? 100 : Math.max(15, 100 - countNum * 18);
  const degrees = ringPercentage * 3.6;

  let background = '';
  let summaryText = '';
  let statusColor = 'var(--primary, #4edea3)';

  if (countNum === 0) {
    background = `
      conic-gradient(
        var(--primary, #4edea3) 0deg,
        var(--primary, #4edea3) ${degrees}deg,
        var(--surface-container-highest, #30353c) ${degrees}deg
      )
    `;
    summaryText = 'ALL ANNUNCIATORS CLEAR';
  } else {
    statusColor = 'var(--error, #ffb4ab)';
    background = `
      conic-gradient(
        var(--error, #ffb4ab) 0deg,
        var(--error, #ffb4ab) ${degrees}deg,
        var(--surface-container-highest, #30353c) ${degrees}deg
      )
    `;
    summaryText = `${countNum} ALARM CONDITION${countNum === 1 ? '' : 'S'} PENDING`;
  }

  return (
    <div className="widget alert-widget">
      <div className="widget-title">
        <span className="label-caps">Alarm Annunciator</span>
        <span className="widget-icon"></span>
      </div>

      <div className="alert-ring" id="alert-ring" style={{ background }}>
        <div>
          <strong id="active-alerts" className="display-process-val">{countNum}</strong>
          <small className="label-caps">ACTIVE</small>
        </div>
      </div>

      <div
        id="alert-summary"
        className="alarm-annunciator"
        style={{ color: statusColor, marginTop: '6px' }}
      >
        {summaryText}
      </div>
    </div>
  );
};

export default AlertRing;
