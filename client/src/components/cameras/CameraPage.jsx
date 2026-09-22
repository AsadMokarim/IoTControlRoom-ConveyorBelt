import React from 'react';
import CameraGrid from './CameraGrid';
import RelayStatusBadge from '../dashboard/RelayStatusBadge';

const CameraPage = ({ onBack, telemetryData }) => {
  const kpis = telemetryData?.kpis || {};
  const relay = telemetryData?.relay || {};
  const isLive = Boolean(telemetryData?.is_live);

  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: 'var(--background, #0f172a)' }}>
      <main className="main-content" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
        {/* Navigation / Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>←</span>
              <span>Back to Overview</span>
            </button>
            <div>
              <h1 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text, #e2e8f0)', fontWeight: 800 }}>
                ESP32-CAM Video Monitoring Room
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--muted, #94a3b8)' }}>
                Direct low-latency MJPEG feeds from wireless cameras on conveyor belt hotspot
              </p>
            </div>
          </div>

          <RelayStatusBadge relayState={relay} isLive={isLive} isWsConnected={true} />
        </header>

        {/* Live Video Feeds */}
        <CameraGrid />

        {/* Real-time Telemetry Status Bar */}
        <div
          style={{
            marginTop: '24px',
            background: 'var(--panel, #1e293b)',
            border: '1px solid var(--panel-border, rgba(148, 163, 184, 0.2))',
            borderRadius: '8px',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted, #94a3b8)', textTransform: 'uppercase' }}>
              Motor Temperature
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8' }}>
              {kpis.average_temperature ? `${kpis.average_temperature.toFixed(1)} °C` : '--'}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted, #94a3b8)', textTransform: 'uppercase' }}>
              Vibration RMS
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8' }}>
              {kpis.rms_vibration ? `${kpis.rms_vibration.toFixed(2)} mm/s` : '--'}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted, #94a3b8)', textTransform: 'uppercase' }}>
              Motor Current
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#22c55e' }}>
              {kpis.motor_current ? `${kpis.motor_current.toFixed(2)} A` : '--'}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted, #94a3b8)', textTransform: 'uppercase' }}>
              Acoustic Noise
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#facc15' }}>
              {kpis.acoustic_db ? `${kpis.acoustic_db.toFixed(1)} dB` : '--'}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted, #94a3b8)', textTransform: 'uppercase' }}>
              Active Alerts
            </div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: (kpis.active_alerts || 0) > 0 ? '#ef4444' : '#22c55e',
              }}
            >
              {kpis.active_alerts ?? 0}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CameraPage;
