import { useState, useCallback } from 'react';

/**
 * ConveyorControl — Manual ON/OFF control panel for the conveyor motor.
 * Sends POST /api/conveyor/control with { command: "ON" | "OFF" }.
 */
export default function ConveyorControl() {
  const [lastCommand, setLastCommand] = useState(null);   // "ON" | "OFF" | null
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);        // { text, type: "success"|"error" }

  const sendCommand = useCallback(async (command) => {
    if (isSending) return; // prevent duplicate requests

    setIsSending(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/conveyor/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setLastCommand(command);
        setStatusMsg({ text: `${command} command sent`, type: 'success' });
      } else {
        setStatusMsg({ text: data.message || 'Unable to send command', type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: 'Unable to send command — server unreachable', type: 'error' });
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  return (
    <div className="conveyor-control-card">
      <div className="conveyor-control-header">
        <span className="conveyor-control-icon">⚙</span>
        <span className="conveyor-control-title">Conveyor Control</span>
        {lastCommand && (
          <span className={`conveyor-control-indicator ${lastCommand === 'ON' ? 'indicator-on' : 'indicator-off'}`}>
            {lastCommand}
          </span>
        )}
      </div>

      <div className="conveyor-control-buttons">
        <button
          id="conveyor-btn-on"
          className={`conveyor-btn conveyor-btn-on ${lastCommand === 'ON' ? 'active' : ''}`}
          onClick={() => sendCommand('ON')}
          disabled={isSending}
          aria-label="Turn conveyor ON"
        >
          {isSending && lastCommand !== 'ON' ? '...' : 'ON'}
        </button>
        <button
          id="conveyor-btn-off"
          className={`conveyor-btn conveyor-btn-off ${lastCommand === 'OFF' ? 'active' : ''}`}
          onClick={() => sendCommand('OFF')}
          disabled={isSending}
          aria-label="Turn conveyor OFF"
        >
          {isSending && lastCommand !== 'OFF' ? '...' : 'OFF'}
        </button>
      </div>

      {isSending && (
        <div className="conveyor-status conveyor-status-sending">Sending command…</div>
      )}

      {!isSending && statusMsg && (
        <div className={`conveyor-status ${statusMsg.type === 'success' ? 'conveyor-status-success' : 'conveyor-status-error'}`}>
          {statusMsg.text}
        </div>
      )}
    </div>
  );
}
