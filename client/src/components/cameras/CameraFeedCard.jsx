import React, { useState, useRef } from 'react';

const CameraFeedCard = ({ camera }) => {
  const { id, label, ip, port = 81, streamPath = '/stream' } = camera;
  const [retryKey, setRetryKey] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [hasError, setHasError] = useState(false);
  const cardRef = useRef(null);

  const streamUrl = `http://${ip}:${port}${streamPath}${retryKey ? `?t=${retryKey}` : ''}`;

  const handleReload = () => {
    setHasError(false);
    setIsLive(false);
    setRetryKey(Date.now());
  };

  const handleToggleFullscreen = () => {
    if (!cardRef.current) return;
    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={cardRef}
      className="panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#0b1329',
        border: '1px solid var(--panel-border, rgba(148, 163, 184, 0.2))',
        position: 'relative',
      }}
    >
      {/* Camera Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          background: 'rgba(15, 23, 42, 0.85)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isLive && !hasError ? '#22c55e' : '#ef4444',
              boxShadow: isLive && !hasError ? '0 0 8px #22c55e' : '0 0 6px #ef4444',
            }}
          />
          <strong style={{ fontSize: '0.9rem', color: 'var(--text, #e2e8f0)' }}>{label}</strong>
          <code
            style={{
              fontSize: '0.72rem',
              color: 'var(--muted, #94a3b8)',
              background: 'rgba(0,0,0,0.3)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {ip}:{port}
          </code>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleReload}
            title="Reload Video Stream"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            🔄
          </button>
          <button
            onClick={handleToggleFullscreen}
            title="Fullscreen"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Video Stream Area */}
      <div
        style={{
          width: '100%',
          height: '320px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050a14',
        }}
      >
        {!hasError ? (
          <img
            key={retryKey}
            src={streamUrl}
            alt={label}
            onLoad={() => {
              setIsLive(true);
              setHasError(false);
            }}
            onError={() => {
              setHasError(true);
              setIsLive(false);
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isLive ? 'block' : 'none',
            }}
          />
        ) : null}

        {/* Loading State */}
        {!isLive && !hasError && (
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📡</div>
            <div style={{ fontSize: '0.85rem' }}>Connecting to ESP32-CAM stream...</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>{streamUrl}</div>
          </div>
        )}

        {/* Offline Error Fallback */}
        {hasError && (
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              maxWidth: '380px',
              color: '#cbd5e1',
            }}
          >
            <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>📹❌</div>
            <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: '#f87171' }}>Camera Stream Offline</h4>
            <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Unable to reach MJPEG feed at <code style={{ color: '#38bdf8' }}>{streamUrl}</code>. Check that the ESP32-CAM is powered and connected to the Pi Wi-Fi hotspot.
            </p>
            <button
              onClick={handleReload}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Live Badge Overlay when active */}
        {isLive && !hasError && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(0,0,0,0.65)',
              color: '#ef4444',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.05em',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 6px #ef4444',
              }}
            />
            LIVE FEED
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraFeedCard;
