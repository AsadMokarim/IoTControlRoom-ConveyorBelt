import { useState, useEffect, useRef } from 'react';
import { generateClientMockTelemetry } from '../utils/mockTelemetry';

const API_BASE = import.meta.env.VITE_API_URL || '';

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (import.meta.env.VITE_API_URL) {
    try {
      const u = new URL(import.meta.env.VITE_API_URL);
      const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${u.host}`;
    } catch (_) {}
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.port === '5173'
    ? `${window.location.hostname}:3001`
    : window.location.host;
  return `${protocol}//${host}`;
};

const initialRelayState = {
  state: 'CLOSED',
  trip_triggered: false,
  trip_reason: 'NONE',
  tripped_at: null,
};

export const useTelemetry = () => {
  const [relayState, setRelayState] = useState(initialRelayState);
  const relayStateRef = useRef(initialRelayState);
  relayStateRef.current = relayState;

  // Initialize data immediately with realistic mock telemetry so UI is never blank
  const [data, setData] = useState(() => generateClientMockTelemetry(initialRelayState));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isWsConnected, setIsWsConnected] = useState(false);

  const wsRef = useRef(null);
  const lastServerDataTimeRef = useRef(0);
  const simIntervalRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Listen for local control signals (STOP/START) to update state with 0 latency
  useEffect(() => {
    const handleControlEvent = (event) => {
      const { action, reason } = event.detail || {};
      if (action === 'STOP' || action === 'CUTOFF') {
        const nextRelay = {
          state: 'TRIPPED',
          trip_triggered: true,
          trip_reason: reason || 'EMERGENCY_STOP',
          tripped_at: new Date().toISOString(),
        };
        setRelayState(nextRelay);
        relayStateRef.current = nextRelay;
        setData(generateClientMockTelemetry(nextRelay));
      } else if (action === 'START' || action === 'RESET') {
        const nextRelay = {
          state: 'CLOSED',
          trip_triggered: false,
          trip_reason: 'NONE',
          tripped_at: null,
        };
        setRelayState(nextRelay);
        relayStateRef.current = nextRelay;
        setData(generateClientMockTelemetry(nextRelay));
      }
    };

    window.addEventListener('conveyor:control', handleControlEvent);
    return () => window.removeEventListener('conveyor:control', handleControlEvent);
  }, []);

  useEffect(() => {
    let mounted = true;

    // HTTP fetch fallback
    const fetchHttpData = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/dashboard`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response');
        }
        const result = JSON.parse(text);
        if (mounted && result) {
          lastServerDataTimeRef.current = Date.now();
          setData(result);
          setError(null);
          setIsLoading(false);
          if (result.relay) {
            setRelayState(result.relay);
            relayStateRef.current = result.relay;
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          // If server fails or offline, continue seamlessly with client simulation
        }
      }
    };

    // Client-side simulation heartbeat: runs every 1000ms
    // If server hasn't sent data in the last 2.5 seconds, advance client simulation
    simIntervalRef.current = setInterval(() => {
      if (!mounted) return;
      const timeSinceServer = Date.now() - lastServerDataTimeRef.current;
      if (timeSinceServer > 2500) {
        setData(generateClientMockTelemetry(relayStateRef.current));
      }
    }, 1000);

    // Initial fetch to test server connection
    fetchHttpData();

    // Setup WebSocket connection
    const connectWs = () => {
      try {
        const wsUrl = getWsUrl();
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mounted) return;
          setIsWsConnected(true);
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        };

        ws.onmessage = (event) => {
          if (!mounted) return;
          try {
            const telemetry = JSON.parse(event.data);
            if (telemetry) {
              lastServerDataTimeRef.current = Date.now();
              setData(telemetry);
              setError(null);
              setIsLoading(false);
              if (telemetry.relay) {
                setRelayState(telemetry.relay);
                relayStateRef.current = telemetry.relay;
              }
            }
          } catch (e) {
            console.error('[WS] Parse error:', e);
          }
        };

        ws.onerror = () => {
          if (!mounted) return;
          setIsWsConnected(false);
        };

        ws.onclose = () => {
          if (!mounted) return;
          setIsWsConnected(false);
          if (!pollTimerRef.current) {
            pollTimerRef.current = setInterval(fetchHttpData, 3000);
          }
          // Attempt reconnection after 5 seconds
          setTimeout(() => {
            if (mounted) connectWs();
          }, 5000);
        };
      } catch (err) {
        console.warn('[WS] WebSocket unavailable, operating with client simulation fallback:', err);
        if (!pollTimerRef.current) {
          pollTimerRef.current = setInterval(fetchHttpData, 4000);
        }
      }
    };

    connectWs();

    return () => {
      mounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    isWsConnected,
    isLive: Boolean(data?.is_live),
    relayState: data?.relay || relayState,
  };
};

export default useTelemetry;
