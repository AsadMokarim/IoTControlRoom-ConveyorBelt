import { useState, useCallback } from 'react';

export const useControl = () => {
  const [isPending, setIsPending] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const triggerCutoff = useCallback(async (reason = 'EMERGENCY_STOP') => {
    setIsPending(true);
    setLastError(null);
    try {
      const res = await fetch('/api/control/cutoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, source: 'dashboard' }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to trigger cutoff');
      }
      setActionMessage('Emergency cutoff command dispatched to ESP32 relay.');
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
      const res = await fetch('/api/control/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'dashboard' }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to reset relay');
      }
      setActionMessage('Motor reset command sent. Relay closed.');
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
    triggerReset,
    isPending,
    lastError,
    actionMessage,
    clearMessage: () => setActionMessage(null),
  };
};

export default useControl;
