import { useState, useEffect, useRef } from 'react';

const useTelemetry = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const wsRef = useRef(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    // HTTP fetch fallback
    const fetchHttpData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const result = await response.json();
        if (mounted) {
          setData(result);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    // Initial fetch to get data instantly
    fetchHttpData();

    // Setup WebSocket connection
    const connectWs = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // In Vite dev mode (port 5173), server runs on 3001
        const host = window.location.port === '5173'
          ? `${window.location.hostname}:3001`
          : window.location.host;
        const wsUrl = `${protocol}//${host}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mounted) return;
          setIsWsConnected(true);
          // Stop HTTP polling interval when WS is active
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        };

        ws.onmessage = (event) => {
          if (!mounted) return;
          try {
            const telemetry = JSON.parse(event.data);
            setData(telemetry);
            setError(null);
            setIsLoading(false);
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
          // Fall back to polling every 2s if WS disconnects
          if (!pollTimerRef.current) {
            pollTimerRef.current = setInterval(fetchHttpData, 2000);
          }
          // Try reconnecting WS after 3 seconds
          setTimeout(() => {
            if (mounted) connectWs();
          }, 3000);
        };
      } catch (err) {
        console.warn('[WS] Connection failed, falling back to polling:', err);
        if (!pollTimerRef.current) {
          pollTimerRef.current = setInterval(fetchHttpData, 2000);
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
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    isWsConnected,
    isLive: Boolean(data?.is_live),
    relayState: data?.relay || { state: 'CLOSED', trip_triggered: false, trip_reason: 'NONE' },
  };
};

export default useTelemetry;
