import React, { useRef, useState, useEffect, useCallback } from 'react';
import DigitalTwinCanvas from './DigitalTwinCanvas';
import TwinAlertOverlay from './TwinAlertOverlay';

const JOINTS_INITIAL = [
  { id: 'joint_1', label: 'Joint 1 (Splice A)', state: 'NORMAL', riskPercent: 8, temperature: 43.5, vibration: 1.4, gapWidth: 1.8, wearLevel: 14, tension: 96 },
  { id: 'joint_2', label: 'Joint 2 (Splice B)', state: 'NORMAL', riskPercent: 18, temperature: 52.4, vibration: 2.8, gapWidth: 2.6, wearLevel: 32, tension: 90 },
  { id: 'joint_3', label: 'Joint 3 (Splice C)', state: 'NORMAL', riskPercent: 5, temperature: 41.0, vibration: 1.1, gapWidth: 1.5, wearLevel: 10, tension: 98 },
  { id: 'joint_4', label: 'Joint 4 (Splice D)', state: 'NORMAL', riskPercent: 24, temperature: 58.2, vibration: 3.2, gapWidth: 3.2, wearLevel: 38, tension: 86 },
];

const STATE_COLORS = {
  NORMAL:   { dot: '#22c55e', dim: 'rgba(34,197,94,0.15)' },
  WARNING:  { dot: '#f59e0b', dim: 'rgba(245,158,11,0.15)' },
  CRITICAL: { dot: '#ef4444', dim: 'rgba(239,68,68,0.15)' },
};

export default function DigitalTwinPage({ onBack, telemetryData }) {
  const twinRef = useRef(null);
  const [failureStage, setFailureStage] = useState(0); // 0: Normal, 1: Minor defect, 2: Severe degradation, 3: Emergency trip
  const [alertActive, setAlertActive] = useState(false);
  const [selectedJoint, setSelectedJoint] = useState(null);
  const [joints, setJoints] = useState(JOINTS_INITIAL);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [isWhiteBg, setIsWhiteBg] = useState(false);
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
    // Immediately enter Stage 1: Minor defect (WARNING, motor RUNNING)
    setFailureStage(1);
    setAlertActive(false);

    // Stage 2 after 3.5s: Severe degradation (CRITICAL 76%, motor RUNNING)
    const t1 = setTimeout(() => {
      setFailureStage(2);
    }, 3500);

    // Stage 3 after 7.5s: Failure point reached (Emergency Trip 96%, motor STOPPED)
    const t2 = setTimeout(() => {
      setFailureStage(3);
      setAlertActive(true);
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
  };

  const handleResetCamera = () => {
    if (twinRef.current?.resetCamera) twinRef.current.resetCamera();
  };

  const handleToggleBg = () => {
    if (twinRef.current?.toggleBackground) {
      twinRef.current.toggleBackground();
      setIsWhiteBg(p => !p);
    }
  };

  const handleJointSelect = useCallback((jointId) => {
    setSelectedJoint(prev => prev === jointId ? null : jointId);
  }, []);

  const systemStatus = telemetryData?.system_status || 'normal';
  const avgTemp = Number(telemetryData?.kpis?.average_temperature) || 0;
  const vibration = Number(telemetryData?.kpis?.rms_vibration) || 0;
  const rawCurrent = Number(telemetryData?.kpis?.motor_current) || 1.34;
  const motorCurrent = failureStage === 3 ? 0.0 : failureStage === 2 ? 2.45 : failureStage === 1 ? 1.85 : rawCurrent;
  const motorRunning = failureStage !== 3 && systemStatus !== 'critical';
  const timeSinceUpdate = Math.floor((Date.now() - lastUpdateTime) / 1000);

  const selectedJointData = joints.find(j => j.id === selectedJoint);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0a0e17',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Top Header */}
      <header style={{
        height: '52px',
        background: 'rgba(15,23,42,0.95)',
        borderBottom: '1px solid rgba(100,116,139,0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(51,65,85,0.4)',
              border: '1px solid rgba(100,116,139,0.22)',
              color: '#94a3b8',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.target.style.color = '#e2e8f0'; e.target.style.background = 'rgba(51,65,85,0.7)'; }}
            onMouseLeave={e => { e.target.style.color = '#94a3b8'; e.target.style.background = 'rgba(51,65,85,0.4)'; }}
          >
            ← Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🏭</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.5px' }}>
              Digital Twin — Conveyor Belt System
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* System Health Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '6px',
            background: failureStage >= 2 || systemStatus === 'critical'
              ? 'rgba(239,68,68,0.15)'
              : failureStage === 1 || systemStatus === 'warning'
              ? 'rgba(245,158,11,0.15)'
              : 'rgba(34,197,94,0.15)',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            color: failureStage >= 2 || systemStatus === 'critical' ? '#ef4444'
              : failureStage === 1 || systemStatus === 'warning' ? '#f59e0b' : '#22c55e',
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: failureStage >= 2 || systemStatus === 'critical' ? '#ef4444'
                : failureStage === 1 || systemStatus === 'warning' ? '#f59e0b' : '#22c55e',
              boxShadow: `0 0 6px ${failureStage >= 2 || systemStatus === 'critical' ? '#ef4444'
                : failureStage === 1 || systemStatus === 'warning' ? '#f59e0b' : '#22c55e'}`,
              flexShrink: 0,
              animation: (failureStage >= 2 || systemStatus === 'critical') ? 'pulseDot 0.8s ease-in-out infinite' : 'none',
            }} />
            {failureStage === 3 ? 'CRITICAL FAILURE' : failureStage === 2 ? 'DEGRADATION CRITICAL' : failureStage === 1 ? 'DEGRADATION WARNING' : systemStatus.toUpperCase()}
          </div>

          {/* Sync indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            color: '#64748b',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 5px #22c55e',
              animation: 'pulseDot 2s ease-in-out infinite',
            }} />
            SYNCED · {timeSinceUpdate}s ago
          </div>
        </div>
      </header>

      {/* Main layout: sidebar + canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left sidebar */}
        <aside style={{
          width: '260px',
          flexShrink: 0,
          background: 'rgba(15,23,42,0.88)',
          borderRight: '1px solid rgba(100,116,139,0.22)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {/* Sensor readings */}
            <section style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 600, letterSpacing: '1.2px',
                color: '#64748b', textTransform: 'uppercase', marginBottom: '10px',
              }}>Live Readings</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { label: 'VIB RMS', value: vibration.toFixed(2), unit: 'mm/s', warning: vibration > 5, critical: vibration > 7 },
                  { label: 'TEMP AVG', value: avgTemp.toFixed(1), unit: '°C', warning: avgTemp > 65, critical: avgTemp > 80 },
                  { label: 'MOTOR', value: motorRunning ? 'RUNNING' : 'STOPPED', unit: '', isStatus: true, running: motorRunning },
                  { label: 'LOAD', value: '80', unit: '%' },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'rgba(30,41,59,0.45)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}>
                    <span style={{ fontSize: '10px', color: '#64748b', letterSpacing: '0.3px' }}>{item.label}</span>
                    <span style={{
                      fontSize: item.isStatus ? '11px' : '15px',
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: item.isStatus
                        ? (item.running ? '#22c55e' : '#ef4444')
                        : item.critical ? '#ef4444'
                        : item.warning ? '#f59e0b'
                        : '#e2e8f0',
                    }}>
                      {item.value}
                      {item.unit && <span style={{ fontSize: '11px', fontWeight: 400, color: '#94a3b8', marginLeft: '2px' }}>{item.unit}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Joint status list */}
            <section style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 600, letterSpacing: '1.2px',
                color: '#64748b', textTransform: 'uppercase', marginBottom: '10px',
              }}>Joint Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {joints.map(joint => {
                  const isSelected = selectedJoint === joint.id;
                  const colors = STATE_COLORS[joint.state];
                  return (
                    <div
                      key={joint.id}
                      onClick={() => handleJointSelect(joint.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(51,65,85,0.4)' : 'rgba(30,41,59,0.45)',
                        outline: isSelected ? '1px solid rgba(100,116,139,0.22)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                        background: colors.dot,
                        boxShadow: `0 0 ${joint.state === 'CRITICAL' ? '8px' : '4px'} ${colors.dot}`,
                        animation: joint.state === 'CRITICAL' ? 'pulseDot 0.8s ease-in-out infinite' : 'none',
                      }} />
                      <span style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: '#e2e8f0' }}>{joint.label}</span>
                      <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8' }}>
                        {joint.riskPercent}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Selected joint detail */}
              {selectedJointData && (
                <div style={{
                  marginTop: '10px',
                  background: 'rgba(30,41,59,0.45)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  border: '1px solid rgba(100,116,139,0.22)',
                }}>
                  <div style={{
                    fontSize: '11px', fontWeight: 600, color: '#94a3b8',
                    letterSpacing: '0.5px', marginBottom: '8px',
                  }}>
                    {selectedJointData.label} — Detail
                  </div>
                  {[
                    { label: 'State', value: selectedJointData.state, isState: true },
                    { label: 'Risk Score', value: `${selectedJointData.riskPercent}%` },
                    { label: 'Temp', value: `${selectedJointData.temperature ? selectedJointData.temperature.toFixed(1) : '45.0'} °C` },
                    { label: 'Vibration', value: `${selectedJointData.vibration ? selectedJointData.vibration.toFixed(2) : '1.50'} mm/s` },
                    { label: 'Splice Gap', value: `${selectedJointData.gapWidth ? selectedJointData.gapWidth.toFixed(1) : '2.0'} mm` },
                    { label: 'Surface Wear', value: `${selectedJointData.wearLevel ? selectedJointData.wearLevel.toFixed(0) : '15'}%` },
                    { label: 'Belt Tension', value: `${selectedJointData.tension ? selectedJointData.tension.toFixed(0) : '95'}%` },
                  ].map(row => (
                    <div key={row.label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 0', borderBottom: '1px solid rgba(100,116,139,0.08)',
                    }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{row.label}</span>
                      {row.isState ? (
                        <span style={{
                          fontSize: '11px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                          padding: '2px 8px', borderRadius: '3px',
                          color: STATE_COLORS[selectedJointData.state].dot,
                          background: STATE_COLORS[selectedJointData.state].dim,
                        }}>{selectedJointData.state}</span>
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: 500, fontFamily: "'JetBrains Mono', monospace", color: '#e2e8f0' }}>
                          {row.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Digital Twin Sync Status */}
            <section>
              <div style={{
                fontSize: '10px', fontWeight: 600, letterSpacing: '1.2px',
                color: '#64748b', textTransform: 'uppercase', marginBottom: '10px',
              }}>Twin Sync</div>
              <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#22c55e', boxShadow: '0 0 6px #22c55e',
                  animation: 'pulseDot 2s ease-in-out infinite',
                }} />
                <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8', letterSpacing: '0.5px' }}>
                  SYNCHRONIZED
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', color: '#475569' }}>Updated:</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{timeSinceUpdate}s ago</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(30,41,59,0.45)', borderRadius: '6px', padding: '8px 10px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '3px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 500, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Physical</span>
                  <span style={{
                    fontSize: '12px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.5px',
                    color: motorRunning ? '#22c55e' : '#ef4444',
                  }}>{motorRunning ? 'RUNNING' : 'STOPPED'}</span>
                </div>
                <span style={{ fontSize: '16px', color: '#475569', flexShrink: 0 }}>⟷</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '3px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 500, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Virtual</span>
                  <span style={{
                    fontSize: '12px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.5px',
                    color: motorRunning ? '#22c55e' : '#ef4444',
                  }}>{motorRunning ? 'RUNNING' : 'STOPPED'}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Bottom controls */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(100,116,139,0.22)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <button
              onClick={handleSimulateFailure}
              disabled={failureStage > 0}
              style={{
                padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: failureStage > 0 ? 'default' : 'pointer',
                fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px',
                background: failureStage === 3 ? 'rgba(239,68,68,0.3)' : failureStage > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.15)',
                color: failureStage === 3 ? '#fca5a5' : failureStage > 0 ? '#f59e0b' : '#ef4444',
                transition: 'all 0.2s',
              }}
            >
              {failureStage === 0 && '⚡ Simulate Failure'}
              {failureStage === 1 && '⏳ Stage 1: Minor Defect...'}
              {failureStage === 2 && '⚠️ Stage 2: Severe Degradation...'}
              {failureStage === 3 && '⚡ Stage 3: Emergency Trip!'}
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleReset}
                style={{
                  flex: 1, padding: '7px', borderRadius: '6px', border: '1px solid rgba(100,116,139,0.22)',
                  background: 'rgba(30,41,59,0.45)', color: '#94a3b8', cursor: 'pointer', fontSize: '12px',
                }}
              >↺ Reset</button>
              <button
                onClick={handleResetCamera}
                style={{
                  flex: 1, padding: '7px', borderRadius: '6px', border: '1px solid rgba(100,116,139,0.22)',
                  background: 'rgba(30,41,59,0.45)', color: '#94a3b8', cursor: 'pointer', fontSize: '12px',
                }}
              >⊕ Camera</button>
              <button
                onClick={handleToggleBg}
                style={{
                  flex: 1, padding: '7px', borderRadius: '6px', border: '1px solid rgba(100,116,139,0.22)',
                  background: 'rgba(30,41,59,0.45)', color: '#94a3b8', cursor: 'pointer', fontSize: '12px',
                }}
              >☀ BG</button>
            </div>
          </div>
        </aside>

        {/* Main 3D canvas area */}
        <div style={{ flex: 1, position: 'relative', background: '#0a0e17', overflow: 'hidden', minWidth: 0 }}>
          <DigitalTwinCanvas
            ref={twinRef}
            telemetryData={telemetryData}
            simulateFailure={failureStage}
            onJointSelect={handleJointSelect}
          />

          {/* Telemetry overlay (top-right) */}
          <div style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(15,23,42,0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(100,116,139,0.22)',
            borderRadius: '8px',
            padding: '12px 16px',
            minWidth: '180px',
            zIndex: 5,
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', letterSpacing: '1.2px', marginBottom: '8px', textTransform: 'uppercase' }}>
              Live Telemetry
            </div>
            {[
              { label: 'Temp', value: `${avgTemp.toFixed(1)}°C` },
              { label: 'Vibration', value: `${vibration < 3 ? 'normal' : vibration < 5 ? 'elevated' : 'critical'}` },
              { label: 'Current', value: motorCurrent > 0 ? `${motorCurrent.toFixed(2)} A` : '0.00 A (OFF)' },
              { label: 'Load', value: '80%' },
              { label: 'Noise', value: `${vibration < 3 ? 'normal' : vibration < 5 ? 'moderate' : 'high'}` },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '3px 0', borderBottom: '1px solid rgba(100,116,139,0.08)',
                fontSize: '12px',
              }}>
                <span style={{ color: '#64748b' }}>{item.label}</span>
                <span style={{ color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Stop Overlay */}
      <TwinAlertOverlay
        isActive={alertActive}
        alertData={{ jointName: 'Joint 3 (Splice C)', riskPercent: 96 }}
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
