import React from 'react';
import CameraGrid from './CameraGrid';
import RelayStatusBadge from '../dashboard/RelayStatusBadge';

const CameraPage = ({ onBack, telemetryData }) => {
  const kpis = telemetryData?.kpis || {};
  const relay = telemetryData?.relay || {};
  const isLive = Boolean(telemetryData?.is_live);

  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: 'var(--background, #0f141a)' }}>
      <main className="main-content" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '20px' }}>
        {/* Navigation / Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--outline-variant, #3c4a42)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={onBack}
              className="alarm-annunciator"
              style={{
                background: 'var(--surface-container-high, #252a31)',
                color: 'var(--primary, #4edea3)',
                border: '1px solid var(--outline-variant, #3c4a42)',
                padding: '6px 12px',
                borderRadius: 'var(--rounded-sm, 0.125rem)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>←</span>
              <span>SCADA OVERVIEW</span>
            </button>
            <div>
              <h1 className="headline-panel" style={{ fontSize: '18px', margin: 0, color: 'var(--on-surface, #dee3eb)' }}>
                ESP32-CAM Industrial Surveillance Feed
              </h1>
              <p className="body-dense" style={{ margin: '2px 0 0', color: 'var(--on-surface-variant, #bbcabf)' }}>
                Low-latency MJPEG operator feed channels direct from conveyor optical sensor nodes
              </p>
            </div>
          </div>

          <RelayStatusBadge relayState={relay} isLive={isLive} isWsConnected={true} />
        </header>

        {/* Live Video Feeds */}
        <CameraGrid />

        {/* Real-time Telemetry Status Bar */}
        <div
          className="panel"
          style={{
            marginTop: '20px',
            background: 'var(--surface-container, #1b2026)',
            border: '1px solid var(--outline-variant, #3c4a42)',
            borderRadius: 'var(--rounded, 0.25rem)',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div className="label-caps" style={{ color: 'var(--on-surface-variant, #bbcabf)' }}>
              Motor Temperature
            </div>
            <div className="display-process-val" style={{ fontSize: '20px', color: 'var(--primary, #4edea3)' }}>
              {kpis.average_temperature ? `${kpis.average_temperature.toFixed(1)} °C` : '--'}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className="label-caps" style={{ color: 'var(--on-surface-variant, #bbcabf)' }}>
              Vibration RMS
            </div>
            <div className="display-process-val" style={{ fontSize: '20px', color: 'var(--secondary, #adc6ff)' }}>
              {kpis.rms_vibration ? `${kpis.rms_vibration.toFixed(2)} mm/s` : '--'}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className="label-caps" style={{ color: 'var(--on-surface-variant, #bbcabf)' }}>
              Motor Current
            </div>
            <div className="display-process-val" style={{ fontSize: '20px', color: 'var(--primary, #4edea3)' }}>
              {kpis.motor_current ? `${kpis.motor_current.toFixed(2)} A` : '--'}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className="label-caps" style={{ color: 'var(--on-surface-variant, #bbcabf)' }}>
              Acoustic Noise
            </div>
            <div className="display-process-val" style={{ fontSize: '20px', color: 'var(--tertiary, #ffb95f)' }}>
              {kpis.acoustic_db ? `${kpis.acoustic_db.toFixed(1)} dB` : '--'}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className="label-caps" style={{ color: 'var(--on-surface-variant, #bbcabf)' }}>
              Active Alerts
            </div>
            <div
              className="display-process-val"
              style={{
                fontSize: '20px',
                color: (kpis.active_alerts || 0) > 0 ? 'var(--error, #ffb4ab)' : 'var(--primary, #4edea3)',
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
