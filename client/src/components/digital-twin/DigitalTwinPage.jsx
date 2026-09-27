import React, { useRef, useState, useEffect, useCallback } from 'react';
import DigitalTwinCanvas from './DigitalTwinCanvas';
import TwinAlertOverlay from './TwinAlertOverlay';
import RelayStatusBadge from '../dashboard/RelayStatusBadge';

const JOINTS_INITIAL = [
  { id: 'joint_1', label: 'Joint 1 (Splice A)', state: 'NORMAL', riskPercent: 8, temperature: 43.5, vibration: 1.4, gapWidth: 1.8, wearLevel: 14, tension: 96 },
  { id: 'joint_2', label: 'Joint 2 (Splice B)', state: 'NORMAL', riskPercent: 18, temperature: 52.4, vibration: 2.8, gapWidth: 2.6, wearLevel: 32, tension: 90 },
  { id: 'joint_3', label: 'Joint 3 (Splice C)', state: 'NORMAL', riskPercent: 5, temperature: 41.0, vibration: 1.1, gapWidth: 1.5, wearLevel: 10, tension: 98 },
  { id: 'joint_4', label: 'Joint 4 (Splice D)', state: 'NORMAL', riskPercent: 24, temperature: 58.2, vibration: 3.2, gapWidth: 3.2, wearLevel: 38, tension: 86 },
];

const STATE_THEME = {
  NORMAL:   { dot: 'var(--primary, #4edea3)', bg: 'rgba(78, 222, 163, 0.12)', border: 'var(--primary-container, #10b981)' },
  WARNING:  { dot: 'var(--tertiary, #ffb95f)', bg: 'rgba(255, 185, 95, 0.12)', border: 'var(--tertiary-container, #e29100)' },
  CRITICAL: { dot: 'var(--error, #ffb4ab)', bg: 'rgba(255, 180, 171, 0.12)', border: 'var(--error-container, #93000a)' },
};

export default function DigitalTwinPage({
  onBack,
  telemetryData,
  relayState,
  isPaused = false,
  onCutoff,
  onReset,
  isPending = false,
  isLight = false,
  toggleTheme,
  onNavigate,
}) {
  const twinRef = useRef(null);
  const [failureStage, setFailureStage] = useState(0); // 0: Normal, 1: Minor defect, 2: Severe degradation, 3: Emergency trip
  const [alertActive, setAlertActive] = useState(false);
  const [selectedJoint, setSelectedJoint] = useState(null);
  const [joints, setJoints] = useState(JOINTS_INITIAL);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const simTimerRef = useRef(null);

  // Update joints based on telemetryData and failureStage
  useEffect(() => {
    if (!telemetryData) return;
    const remoteJoints = telemetryData.joints;
    setJoints(prev => prev.map((j) => {
      if (j.id === 'joint_3') {
        if (failureStage === 1) {
          return {
            ...j,
            state: 'WARNING',
            riskPercent: 38,
            temperature: 58.4,
            vibration: 3.6,
            gapWidth: 3.2,
            wearLevel: 42,
            tension: 86
          };
        } else if (failureStage === 2) {
          return {
            ...j,
            state: 'CRITICAL',
            riskPercent: 76,
            temperature: 74.8,
            vibration: 6.2,
            gapWidth: 4.8,
            wearLevel: 72,
            tension: 68
          };
        } else if (failureStage === 3) {
          return {
            ...j,
            state: 'CRITICAL',
            riskPercent: 96,
            temperature: 88.6,
            vibration: 8.4,
            gapWidth: 6.2,
            wearLevel: 92,
            tension: 54
          };
        }
      }
      const r = remoteJoints?.find(item => item.id === j.id);
      if (r) {
        return {
          ...j,
          label: r.name || j.label,
          state: r.state,
          riskPercent: r.riskPercent,
          temperature: r.temperature,
          vibration: r.vibration,
          gapWidth: r.gapWidth,
          wearLevel: r.wearLevel,
          tension: r.tension
        };
      }
      return j;
    }));
    setLastUpdateTime(Date.now());
  }, [telemetryData, failureStage]);

  const handleSimulateFailure = () => {
    if (simTimerRef.current) {
      clearTimeout(simTimerRef.current.t1);
      clearTimeout(simTimerRef.current.t2);
    }
    setFailureStage(1);
    setAlertActive(false);

    const t1 = setTimeout(() => {
      setFailureStage(2);
    }, 3500);

    const t2 = setTimeout(() => {
      setFailureStage(3);
      setAlertActive(true);
      if (onCutoff) onCutoff('SIMULATED_CRITICAL_FAILURE');
    }, 7500);

    simTimerRef.current = { t1, t2 };
  };

  const handleReset = () => {
    if (simTimerRef.current) {
      clearTimeout(simTimerRef.current.t1);
      clearTimeout(simTimerRef.current.t2);
      simTimerRef.current = null;
    }
    setFailureStage(0);
    setAlertActive(false);
    setJoints(JOINTS_INITIAL);
    setSelectedJoint(null);
    if (onReset) onReset();
  };

  const handleResetCamera = () => {
    if (twinRef.current?.resetCamera) twinRef.current.resetCamera();
  };

  const handleToggle3DTheme = () => {
    if (twinRef.current?.toggleBackground) {
      twinRef.current.toggleBackground();
    }
  };

  const handleJointSelect = useCallback((jointId) => {
    setSelectedJoint(prev => prev === jointId ? null : jointId);
  }, []);

  const isTripped = relayState?.state === 'TRIPPED' || relayState?.trip_triggered || isPaused;
  const systemStatus = isTripped || failureStage === 3 ? 'critical' : (telemetryData?.system_status || 'normal');
  const avgTemp = telemetryData?.kpis?.average_temperature !== undefined ? Number(telemetryData.kpis.average_temperature) : 45.0;
  const vibration = telemetryData?.kpis?.rms_vibration !== undefined ? Number(telemetryData.kpis.rms_vibration) : 0.0;
  const rawCurrent = telemetryData?.kpis?.motor_current !== undefined ? Number(telemetryData.kpis.motor_current) : 0.0;
  const acoustic = telemetryData?.kpis?.acoustic_db !== undefined ? Number(telemetryData.kpis.acoustic_db) : 68.0;
  const motorCurrent = isTripped || failureStage === 3 ? 0.0 : failureStage === 2 ? 2.45 : failureStage === 1 ? 1.85 : rawCurrent;
  const motorRunning = !isTripped && failureStage !== 3 && systemStatus !== 'critical';
  const isLive = Boolean(telemetryData?.is_live);
  const timeSinceUpdate = Math.floor((Date.now() - lastUpdateTime) / 1000);

  const selectedJointData = joints.find(j => j.id === selectedJoint);

  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* SCADA Console Sidebar */}
      <aside className="sidebar">
        <h2>ConveyorGuard</h2>
        <nav>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onBack) onBack();
            }}
          >
            Overview
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('cameras');
            }}
          >
            ESP32 Cameras
          </a>
          <a href="#" className="active" onClick={(e) => e.preventDefault()}>
            Digital Twin
          </a>

          {toggleTheme && (
            <button
              id="theme-toggle"
              className="theme-toggle-btn"
              aria-label="Toggle Dark Mode"
              onClick={toggleTheme}
            >
              <span className="icon">🌓</span>
              <span className="text">{isLight ? 'THEME: LIGHT' : 'THEME: DARK'}</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Main SCADA Workspace */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 'var(--space-lg, 16px)' }}>
        {/* Topbar matching SCADA Console */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={onBack}
              className="alarm-annunciator"
              style={{
                background: 'var(--surface-container-high)',
                color: 'var(--primary)',
                border: '1px solid var(--outline-variant)',
                padding: '6px 12px',
                borderRadius: 'var(--rounded-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>←</span>
              <span>OVERVIEW</span>
            </button>
            <div>
              <h1>Digital Twin</h1>
              <p id="last-updated">Real-time kinematic twin synchronized via ESP32 telemetry · ISO 10816 condition monitoring</p>
            </div>
          </div>

          {/* Status & Relay Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <RelayStatusBadge relayState={relayState} isLive={isLive} isWsConnected={true} />

            <div id="system-status" className={`status-badge ${systemStatus}`}>
              {systemStatus.toUpperCase()}
            </div>

            {isTripped && (
              <span
                className="alarm-annunciator"
                style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--rounded-sm)',
                  background: 'var(--on-error, #690005)',
                  color: 'var(--error, #ffb4ab)',
                  border: '1px solid var(--error-container, #93000a)',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                🛑 E-STOP TRIPPED (PAUSED)
              </span>
            )}

            <div
              className="label-caps"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: 'var(--rounded-sm)',
                background: 'var(--surface-container)',
                border: '1px solid var(--outline-variant)',
                color: 'var(--on-surface-variant)',
                fontSize: '11px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  boxShadow: '0 0 5px var(--primary)',
                }}
              />
              SYNCED · {timeSinceUpdate}s ago
            </div>
          </div>
        </header>

        {/* 2-Column Responsive Twin Layout */}
        <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0, flexWrap: 'wrap' }}>
          {/* Main 3D Twin Stage */}
          <div style={{ flex: '1 1 640px', minWidth: '320px', display: 'flex', flexDirection: 'column' }}>
            <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '560px', padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--outline-variant)', margin: 0 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '15px' }}>3D Conveyor Kinematic Model</h2>
                  <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                    WebGL Engine · Drive Roller, Splice Tracking & Sensor Nodes
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleResetCamera}
                    className="alarm-annunciator"
                    style={{
                      background: 'var(--surface-container-high)',
                      color: 'var(--on-surface)',
                      border: '1px solid var(--outline-variant)',
                      padding: '5px 10px',
                      borderRadius: 'var(--rounded-sm)',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    ⊕ Camera
                  </button>
                  <button
                    onClick={handleToggle3DTheme}
                    className="alarm-annunciator"
                    style={{
                      background: 'var(--surface-container-high)',
                      color: 'var(--on-surface)',
                      border: '1px solid var(--outline-variant)',
                      padding: '5px 10px',
                      borderRadius: 'var(--rounded-sm)',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    🌓 3D Ground
                  </button>
                  <button
                    onClick={handleReset}
                    className="alarm-annunciator"
                    style={{
                      background: 'var(--surface-container-high)',
                      color: 'var(--on-surface)',
                      border: '1px solid var(--outline-variant)',
                      padding: '5px 10px',
                      borderRadius: 'var(--rounded-sm)',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>

              {/* 3D Canvas Container */}
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  background: 'var(--surface-container-lowest, #0a0f14)',
                  overflow: 'hidden',
                  minHeight: '480px',
                }}
              >
                <DigitalTwinCanvas
                  ref={twinRef}
                  telemetryData={telemetryData}
                  simulateFailure={failureStage}
                  onJointSelect={handleJointSelect}
                  isPaused={!motorRunning}
                  isLight={isLight}
                />

                {/* Paused Banner Overlay */}
                {!motorRunning && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      background: 'var(--error-container, #93000a)',
                      color: 'var(--error, #ffb4ab)',
                      border: '1px solid var(--error, #ffb4ab)',
                      borderRadius: 'var(--rounded-sm)',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      zIndex: 10,
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>⏸️</span>
                    <span>DIGITAL TWIN PAUSED — EMERGENCY STOP ACTIVE</span>
                  </div>
                )}

                {/* Floating Telemetry Glass Card */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'var(--surface-container, #1b2026)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid var(--outline-variant)',
                    borderRadius: 'var(--rounded)',
                    padding: '12px 14px',
                    minWidth: '180px',
                    zIndex: 5,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    className="label-caps"
                    style={{
                      color: 'var(--on-surface-variant)',
                      marginBottom: '8px',
                      borderBottom: '1px solid var(--outline-variant)',
                      paddingBottom: '4px',
                    }}
                  >
                    Live Telemetry
                  </div>
                  {[
                    { label: 'Temp', value: `${avgTemp.toFixed(1)}°C`, color: 'var(--primary)' },
                    { label: 'Current', value: `${motorCurrent.toFixed(2)} A`, color: motorCurrent > 15 ? 'var(--error)' : 'var(--on-surface)' },
                    { label: 'Vibration', value: `${vibration.toFixed(2)} mm/s`, color: vibration > 5 ? 'var(--error)' : 'var(--secondary)' },
                    { label: 'Acoustic', value: `${acoustic.toFixed(1)} dB`, color: acoustic > 85 ? 'var(--tertiary)' : 'var(--on-surface)' },
                    {
                      label: 'Motor',
                      value: motorRunning ? 'RUNNING' : (isTripped ? 'E-STOPPED' : 'STOPPED'),
                      color: motorRunning ? 'var(--primary)' : 'var(--error)',
                      bold: true,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '3px 0',
                        fontSize: '11px',
                        borderBottom: '1px solid var(--outline-variant)',
                      }}
                    >
                      <span style={{ color: 'var(--on-surface-variant)' }}>{item.label}</span>
                      <span style={{ color: item.color, fontFamily: 'var(--font-mono)', fontWeight: item.bold ? 700 : 500 }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                
              </div>
            </div>
          </div>

          {/* Right SCADA Diagnostics & Control Column */}
          <div style={{ flex: '0 0 360px', width: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 1. Safety Relay & Breaker Action Box */}
            <div
              className="panel"
              style={{
                border: isTripped ? '1px solid var(--error, #ffb4ab)' : '1px solid var(--outline-variant)',
                background: isTripped ? 'var(--surface-container-high)' : 'var(--surface-container)',
                padding: '12px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>
                  Motor Breaker & Safety Contact
                </div>
                <span
                  className="alarm-annunciator"
                  style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--rounded-sm)',
                    background: isTripped ? 'var(--on-error)' : 'var(--on-primary)',
                    color: isTripped ? 'var(--error)' : 'var(--primary)',
                    border: `1px solid ${isTripped ? 'var(--error-container)' : 'var(--primary-container)'}`,
                    fontSize: '10px',
                  }}
                >
                  {isTripped ? 'TRIPPED / MOTOR HALTED' : 'MOTOR ACTIVE'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onCutoff && onCutoff('EMERGENCY_STOP')}
                  disabled={isPending || isTripped}
                  className="alarm-annunciator"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--rounded-sm)',
                    background: isTripped ? 'var(--surface-container-highest)' : 'var(--error-container, #93000a)',
                    color: isTripped ? 'var(--outline)' : 'var(--error, #ffb4ab)',
                    border: `1px solid ${isTripped ? 'var(--outline-variant)' : 'var(--error)'}`,
                    cursor: isPending || isTripped ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isPending ? 'TRANSMITTING...' : '🛑 EMERGENCY TRIP'}
                </button>

                <button
                  onClick={() => onReset && onReset()}
                  disabled={isPending || !isTripped}
                  className="alarm-annunciator"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--rounded-sm)',
                    background: isTripped ? 'var(--on-primary, #003824)' : 'var(--surface-container-highest)',
                    color: isTripped ? 'var(--primary, #4edea3)' : 'var(--outline)',
                    border: `1px solid ${isTripped ? 'var(--primary-container)' : 'var(--outline-variant)'}`,
                    cursor: isPending || !isTripped ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  🔄 CLEAR INTERLOCK
                </button>
              </div>
            </div>

            {/* 2. Process Readings SCADA Grid */}
            <div className="panel" style={{ padding: '14px 16px' }}>
              <div className="panel-header" style={{ marginBottom: '10px' }}>
                <h3 className="headline-panel" style={{ fontSize: '13px', margin: 0 }}>
                  Live Conveyor Telemetry
                </h3>
                <span className="label-caps" style={{ color: 'var(--primary)' }}>
                  ISO 10816-3
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'MOTOR CURRENT', value: `${motorCurrent.toFixed(2)} A`, valColor: motorCurrent > 15 ? 'var(--error)' : 'var(--primary)' },
                  { label: 'RMS VIBRATION', value: `${vibration.toFixed(2)} mm/s`, valColor: vibration > 5 ? 'var(--error)' : 'var(--secondary)' },
                  { label: 'AVERAGE TEMP', value: `${avgTemp.toFixed(1)} °C`, valColor: avgTemp > 65 ? 'var(--tertiary)' : 'var(--primary)' },
                  { label: 'ACOUSTIC NOISE', value: `${acoustic.toFixed(1)} dB`, valColor: acoustic > 85 ? 'var(--tertiary)' : 'var(--on-surface)' },
                  {
                    label: 'MOTOR STATUS',
                    value: motorRunning ? 'RUNNING' : (isTripped ? 'HALTED' : 'STOPPED'),
                    valColor: motorRunning ? 'var(--primary)' : 'var(--error)',
                  },
                  { label: 'BELT LOAD', value: '80 %', valColor: 'var(--on-surface)' },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: 'var(--surface-container-high)',
                      borderRadius: 'var(--rounded-sm)',
                      padding: '8px 10px',
                      border: '1px solid var(--outline-variant)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <span className="label-caps" style={{ fontSize: '9px', color: 'var(--on-surface-variant)' }}>
                      {item.label}
                    </span>
                    <span
                      className="display-process-val"
                      style={{
                        fontSize: '16px',
                        lineHeight: '20px',
                        color: item.valColor,
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Splice Joint Health & Diagnostics */}
            {/* <div className="panel" style={{ padding: '14px 16px' }}>
              <div className="panel-header" style={{ marginBottom: '10px' }}>
                <h3 className="headline-panel" style={{ fontSize: '13px', margin: 0 }}>
                  Belt Splices & Joint Degradation
                </h3>
                {selectedJointData && (
                  <button
                    onClick={() => setSelectedJoint(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--secondary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              {selectedJointData ? (
                /* Detailed Card for Selected Joint 
                <div
                  style={{
                    background: 'var(--surface-container-high)',
                    borderRadius: 'var(--rounded-sm)',
                    border: '1px solid var(--outline-variant)',
                    padding: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: '13px' }}>
                      {selectedJointData.label}
                    </div>
                    <span
                      className="status-badge"
                      style={{
                        background: STATE_THEME[selectedJointData.state]?.bg,
                        color: STATE_THEME[selectedJointData.state]?.dot,
                        border: `1px solid ${STATE_THEME[selectedJointData.state]?.border}`,
                        padding: '2px 8px',
                        fontSize: '10px',
                      }}
                    >
                      {selectedJointData.state}
                    </span>
                  </div>

                  {/* Risk Progress Bar *
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>Failure Risk</span>
                      <span style={{ fontWeight: 700, color: selectedJointData.riskPercent > 70 ? 'var(--error)' : selectedJointData.riskPercent > 30 ? 'var(--tertiary)' : 'var(--primary)' }}>
                        {selectedJointData.riskPercent}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--surface-container-lowest)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${selectedJointData.riskPercent}%`,
                          height: '100%',
                          background: selectedJointData.riskPercent > 70 ? 'var(--error)' : selectedJointData.riskPercent > 30 ? 'var(--tertiary)' : 'var(--primary)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                    <div style={{ background: 'var(--surface-container)', padding: '6px 8px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--outline-variant)' }}>
                      <span className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>Gap Width</span>
                      <div style={{ fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'var(--font-mono)' }}>{selectedJointData.gapWidth} mm</div>
                    </div>
                    <div style={{ background: 'var(--surface-container)', padding: '6px 8px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--outline-variant)' }}>
                      <span className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>Wear Level</span>
                      <div style={{ fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'var(--font-mono)' }}>{selectedJointData.wearLevel}%</div>
                    </div>
                    <div style={{ background: 'var(--surface-container)', padding: '6px 8px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--outline-variant)' }}>
                      <span className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>Tension</span>
                      <div style={{ fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'var(--font-mono)' }}>{selectedJointData.tension}%</div>
                    </div>
                    <div style={{ background: 'var(--surface-container)', padding: '6px 8px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--outline-variant)' }}>
                      <span className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>Temperature</span>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{selectedJointData.temperature.toFixed(1)} °C</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Compact Joint List when no joint is clicked *
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {joints.map((j) => (
                    <div
                      key={j.id}
                      onClick={() => setSelectedJoint(j.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        background: 'var(--surface-container-high)',
                        borderRadius: 'var(--rounded-sm)',
                        border: '1px solid var(--outline-variant)',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--outline)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--outline-variant)')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: STATE_THEME[j.state]?.dot,
                          }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--on-surface)' }}>{j.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)' }}>
                          {j.riskPercent}% risk
                        </span>
                        <span
                          className="status-badge"
                          style={{
                            background: STATE_THEME[j.state]?.bg,
                            color: STATE_THEME[j.state]?.dot,
                            padding: '1px 6px',
                            fontSize: '9px',
                          }}
                        >
                          {j.state}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div> */}

            {/* 4. Degradation Demo Simulator Station */}
            <div className="panel" style={{ padding: '14px 16px' }}>
              <div className="panel-header" style={{ marginBottom: '8px' }}>
                <h3 className="headline-panel" style={{ fontSize: '13px', margin: 0 }}>
                  Failure Progression Simulator
                </h3>
                <span className="label-caps" style={{ color: 'var(--tertiary)' }}>
                  STAGE {failureStage}/3
                </span>
              </div>
              <p className="body-dense" style={{ color: 'var(--on-surface-variant)', fontSize: '11px', marginBottom: '10px' }}>
                Simulates real splice defect propagation on Joint 3 leading to automated circuit breaker trip.
              </p>

              <button
                onClick={handleSimulateFailure}
                disabled={failureStage > 0 || isTripped}
                className="alarm-annunciator"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--rounded-sm)',
                  border: '1px solid var(--outline-variant)',
                  cursor: failureStage > 0 || isTripped ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  background:
                    failureStage === 3
                      ? 'var(--error-container, #93000a)'
                      : failureStage > 0
                      ? 'var(--tertiary-container, #e29100)'
                      : 'var(--surface-container-high)',
                  color:
                    failureStage === 3
                      ? 'var(--error, #ffb4ab)'
                      : failureStage > 0
                      ? 'var(--tertiary-fixed, #ffddb8)'
                      : 'var(--primary, #4edea3)',
                  transition: 'all 0.2s ease',
                  marginBottom: '8px',
                }}
              >
                {failureStage === 0 && '⚡ START DEFECT SIMULATION'}
                {failureStage === 1 && '⏳ STAGE 1: MINOR DEFECT DETECTED'}
                {failureStage === 2 && '⚠️ STAGE 2: SEVERE SPLICE DEGRADATION'}
                {failureStage === 3 && '🛑 STAGE 3: INTERLOCK TRIPPED'}
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleReset}
                  className="alarm-annunciator"
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 'var(--rounded-sm)',
                    border: '1px solid var(--outline-variant)',
                    background: 'var(--surface-container-high)',
                    color: 'var(--on-surface-variant)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    textAlign: 'center',
                  }}
                >
                  ↺ Reset System
                </button>
                <button
                  onClick={handleResetCamera}
                  className="alarm-annunciator"
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 'var(--rounded-sm)',
                    border: '1px solid var(--outline-variant)',
                    background: 'var(--surface-container-high)',
                    color: 'var(--on-surface-variant)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    textAlign: 'center',
                  }}
                >
                  ⊕ Camera Focus
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Emergency Stop Critical Modal */}
      <TwinAlertOverlay
        isActive={alertActive}
        alertData={{ reason: 'Critical safety threshold exceeded — emergency relay contact tripped circuit.' }}
        onDismiss={handleReset}
      />

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
