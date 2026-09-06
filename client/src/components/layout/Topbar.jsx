import React from 'react';

const Topbar = ({ lastUpdated, systemStatus }) => {
  return (
    <header className="topbar">
      <h1>System Overview</h1>
      <div className="topbar-actions">
        <div className="last-update">
          <span className="update-icon">⏱️</span>
          <span>Last update: <span className="update-time">{lastUpdated}</span></span>
        </div>
        <div className={`system-status status-${systemStatus.toLowerCase()}`}>
          <span className="status-indicator"></span>
          <span>{systemStatus}</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
