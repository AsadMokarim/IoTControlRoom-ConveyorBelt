import { useState, useCallback } from 'react';

export const useControl = () => {
  const [isPending, setIsPending] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const triggerCutoff = useCallback(async (reason = 'EMERGENCY_STOP') => {
    setIsPending(true);
    setLastError(null);
    try {
      const res = await fetch('/api/control/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, source: 'dashboard' }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to trigger emergency stop');
      }
      setActionMessage('🛑 STOP signal dispatched to "conveyor/control". Motor contactor opened.');
      return json;
    } catch (err) {
      setLastError(err.message);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  const triggerReset = useCallback(async () => {
    setIsPending(true);
    setLastError(null);
    try {
      const res = await fetch('/api/control/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'dashboard' }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to send start/reset signal');
      }
      setActionMessage('🔄 START signal dispatched to "conveyor/control". Motor armed.');
      return json;
    } catch (err) {
      setLastError(err.message);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    triggerCutoff,
    triggerStop: triggerCutoff,
    triggerReset,
    triggerStart: triggerReset,
    isPending,
    lastError,
    actionMessage,
    clearMessage: () => setActionMessage(null),
  };
};

export default useControl;
