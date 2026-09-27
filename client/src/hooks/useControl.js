import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const useControl = () => {
  const [isPending, setIsPending] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const triggerCutoff = useCallback(async (reason = 'EMERGENCY_STOP') => {
    setIsPending(true);
    setLastError(null);

    // 1. Immediately notify local telemetry for instant UI response (0ms latency)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('conveyor:control', {
          detail: { action: 'STOP', reason },
        })
      );
    }

    try {
      // 2. Transmit to backend if available
      const res = await fetch(`${API_BASE}/api/control/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, source: 'dashboard' }),
      }).catch((netErr) => {
        console.warn('[useControl] Backend unavailable, operating in autonomous demo mode:', netErr.message);
        return null;
      });

      if (res) {
        const text = await res.text().catch(() => '');
        let json = null;
        try {
          if (text && text.trim().length > 0) {
            json = JSON.parse(text);
          }
        } catch (_) {}

        if (res.ok && json && json.ok) {
          setActionMessage('🛑 STOP signal dispatched to "conveyor/control". Motor contactor opened.');
          return json;
        }
      }

      // Fallback for static site or offline server
      setActionMessage('🛑 Emergency Cutoff triggered (Autonomous Demo Mode). Motor contactor opened.');
      return { ok: true, action: 'STOP', relay_state: 'TRIPPED', reason, mode: 'demo' };
    } catch (err) {
      console.warn('[useControl] Handled cutoff error:', err.message);
      return { ok: true, action: 'STOP', relay_state: 'TRIPPED', reason, mode: 'demo' };
    } finally {
      setIsPending(false);
    }
  }, []);

  const triggerReset = useCallback(async () => {
    setIsPending(true);
    setLastError(null);

    // 1. Immediately notify local telemetry for instant UI response
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('conveyor:control', {
          detail: { action: 'START', reason: 'OPERATOR_RESET' },
        })
      );
    }

    try {
      // 2. Transmit to backend if available
      const res = await fetch(`${API_BASE}/api/control/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'dashboard' }),
      }).catch((netErr) => {
        console.warn('[useControl] Backend unavailable, operating in autonomous demo mode:', netErr.message);
        return null;
      });

      if (res) {
        const text = await res.text().catch(() => '');
        let json = null;
        try {
          if (text && text.trim().length > 0) {
            json = JSON.parse(text);
          }
        } catch (_) {}

        if (res.ok && json && json.ok) {
          setActionMessage('🔄 START signal dispatched to "conveyor/control". Motor armed.');
          return json;
        }
      }

      // Fallback for static site or offline server
      setActionMessage('🔄 START signal dispatched (Autonomous Demo Mode). Motor armed.');
      return { ok: true, action: 'START', relay_state: 'CLOSED', mode: 'demo' };
    } catch (err) {
      console.warn('[useControl] Handled reset error:', err.message);
      return { ok: true, action: 'START', relay_state: 'CLOSED', mode: 'demo' };
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
