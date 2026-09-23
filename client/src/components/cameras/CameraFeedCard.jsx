import React, { useState, useRef } from 'react';

const CameraFeedCard = ({ camera, onUpdateCamera }) => {
  const { id, label, ip, port = 81, streamPath = '/stream' } = camera;
  const [retryKey, setRetryKey] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIp, setEditIp] = useState(ip);
  const [editPort, setEditPort] = useState(port);
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

  const handleSaveIp = (e) => {
    e.preventDefault();
    if (!editIp.trim()) return;
    setIsEditing(false);
    if (onUpdateCamera) {
      onUpdateCamera(id, editIp.trim(), Number(editPort) || 81);
    }
    handleReload();
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
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
              fontSize: '0.75rem',
              color: '#38bdf8',
              background: 'rgba(0,0,0,0.4)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
            }}
          >
            {ip}:{port}
          </code>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => {
              setEditIp(ip);
              setEditPort(port);
              setIsEditing((p) => !p);
            }}
            title="Configure Camera IP & Port"
            style={{
              background: isEditing ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            ⚙️ Edit IP
          </button>
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

      {/* Inline IP Editing Bar */}
      {isEditing && (
        <form
          onSubmit={handleSaveIp}
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Camera IP:</span>
          <input
            type="text"
            value={editIp}
            onChange={(e) => setEditIp(e.target.value)}
            placeholder="e.g. 10.42.0.118"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid #38bdf8',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.82rem',
              width: '140px',
            }}
          />
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Port:</span>
          <input
            type="number"
            value={editPort}
            onChange={(e) => setEditPort(e.target.value)}
            placeholder="81"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid #38bdf8',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.82rem',
              width: '60px',
            }}
          />
          <button
            type="submit"
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '5px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Save & Connect
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={{
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Cancel
          </button>
        </form>
      )}

      {/* Video Stream Area */}
      <div
        style={{
          width: '100%',
          height: '340px',
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
              objectFit: 'contain',
              display: isLive ? 'block' : 'none',
              background: '#000',
            }}
          />
        ) : null}

        {/* Loading State */}
        {!isLive && !hasError && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📡</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' }}>Connecting to ESP32-CAM stream...</div>
            <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '6px' }}>{streamUrl}</div>
          </div>
        )}

        {/* Offline Error Fallback */}
        {hasError && (
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              maxWidth: '420px',
              color: '#cbd5e1',
            }}
          >
            <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>📹❌</div>
            <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#f87171' }}>Camera Stream Offline</h4>
            <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Unable to reach MJPEG feed at <code style={{ color: '#38bdf8' }}>{streamUrl}</code>. Ensure the ESP32-CAM is powered and connected to the Pi Wi-Fi hotspot.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={handleReload}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                🔄 Retry Connection
              </button>
              <button
                onClick={() => {
                  setEditIp(ip);
                  setEditPort(port);
                  setIsEditing(true);
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  padding: '7px 14px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                ⚙️ Change IP
              </button>
            </div>
          </div>
        )}

        {/* Live Badge Overlay when active */}
        {isLive && !hasError && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              padding: '4px 10px',
              borderRadius: '4px',
              background: 'rgba(0,0,0,0.75)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.4)',
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
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
            LIVE FEED ({ip})
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraFeedCard;
