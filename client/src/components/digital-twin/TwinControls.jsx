import React from 'react';

export default function TwinControls({ onSimulate, onReset, onResetCamera, onToggleBg }) {
  return (
    <div className="twin-controls">
      <button onClick={onSimulate} className="btn-simulate">Simulate Failure</button>
      <button onClick={onReset} className="btn-reset">Reset</button>
      <button onClick={onResetCamera} className="btn-reset-camera">Reset Camera</button>
      <button onClick={onToggleBg} className="btn-bg-toggle">Toggle Background</button>
    </div>
  );
}
