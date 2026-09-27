import React from 'react';

export default function TwinStatusBar({ syncStatus }) {
  if (!syncStatus) return null;

  const { status, lastUpdateMs } = syncStatus;

  return (
    <div className="twin-status-bar">
      <span className="status-indicator">
        {status === 'SYNCHRONIZED' ? '🟢 Synchronized' : '🔴 Disconnected'}
      </span>
      {lastUpdateMs !== undefined && (
        <span className="last-update">
          Last update: {lastUpdateMs}ms ago
        </span>
      )}
    </div>
  );
}
