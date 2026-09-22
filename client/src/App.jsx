import { useRef, useState } from 'react';
import HealthScore from './components/dashboard/HealthScore';
import TemperatureGauge from './components/dashboard/TemperatureGauge';
import VibrationMeter from './components/dashboard/VibrationMeter';
import AcousticMeter from './components/dashboard/AcousticMeter';
import CurrentMeter from './components/dashboard/CurrentMeter';
import AlertRing from './components/dashboard/AlertRing';
import RelayStatusBadge from './components/dashboard/RelayStatusBadge';
import EmergencyStopPanel from './components/dashboard/EmergencyStopPanel';
import VibrationChart from './components/dashboard/VibrationChart';
import DigitalTwinStatus from './components/dashboard/DigitalTwinStatus';
import DegradationTimeline from './components/dashboard/DegradationTimeline';
import ThermalMap from './components/dashboard/ThermalMap';
import DigitalTwinCanvas from './components/digital-twin/DigitalTwinCanvas';
import DigitalTwinPage from './components/digital-twin/DigitalTwinPage';
import TwinAlertOverlay from './components/digital-twin/TwinAlertOverlay';
import CameraPage from './components/cameras/CameraPage';
import useTelemetry from './hooks/useTelemetry';
import useControl from './hooks/useControl';
import useTheme from './hooks/useTheme';

const defaultComponents = [
  { name: 'Motor 1', condition: 'normal', temperature: '42.6 °C', vibration: '1.8 mm/s', lastCheck: 'Just now' },
  { name: 'Bearing 1', condition: 'warning', temperature: '68.4 °C', vibration: '4.9 mm/s', lastCheck: 'Just now' },
  { name: 'Pump 1', condition: 'normal', temperature: '39.8 °C', vibration: '1.2 mm/s', lastCheck: '2 min ago' },
  { name: 'Fan 1', condition: 'offline', temperature: '--', vibration: '--', lastCheck: '18 min ago' },
];

function App() {
  const { data, isLoading, error, isWsConnected, isLive, relayState } = useTelemetry();
  const { triggerCutoff, triggerReset, isPending } = useControl();
  const { isLight, toggleTheme } = useTheme();

  const twinRef = useRef();
  const [failureStage, setFailureStage] = useState(0);
  const [alertActive, setAlertActive] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [hasVisitedTwin, setHasVisitedTwin] = useState(false);
  const [hasVisitedCameras, setHasVisitedCameras] = useState(false);
  const appSimTimerRef = useRef(null);

  const handleResetCamera = () => {
    if (twinRef.current && twinRef.current.resetCamera) {
      twinRef.current.resetCamera();
    }
  };

  const handleToggleFailure = () => {
    if (failureStage > 0) {
      if (appSimTimerRef.current) {
        clearTimeout(appSimTimerRef.current.t1);
        clearTimeout(appSimTimerRef.current.t2);
        appSimTimerRef.current = null;
      }
      setFailureStage(0);
      setAlertActive(false);
      triggerReset().catch(() => {});
      return;
    }

    setFailureStage(1);
    setAlertActive(false);

    const t1 = setTimeout(() => {
      setFailureStage(2);
    }, 3500);

    const t2 = setTimeout(() => {
      setFailureStage(3);
      setAlertActive(true);
      triggerCutoff('SIMULATED_CRITICAL_FAILURE').catch(() => {});
    }, 7500);

    appSimTimerRef.current = { t1, t2 };
  };

  const handleCutoff = async (reason) => {
    try {
      await triggerCutoff(reason);
    } catch (err) {
      alert(`Cutoff failed: ${err.message}`);
    }
  };

  const handleReset = async () => {
    try {
      await triggerReset();
      setFailureStage(0);
      setAlertActive(false);
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    }
  };

  const timestamp = data?.timestamp || 'Waiting for data...';
  const baseStatus = data?.system_status || 'normal';
  const isTripped = relayState?.state === 'TRIPPED' || relayState?.trip_triggered;
  const systemStatus = isTripped || failureStage === 3 ? 'critical' : failureStage >= 1 ? 'warning' : baseStatus;

  const rawAvgTemp = data?.kpis?.average_temperature !== undefined ? Number(data.kpis.average_temperature) : 45;
  const rawMaxTemp = data?.kpis?.maximum_temperature !== undefined ? Number(data.kpis.maximum_temperature) : 52;
  const rawVibration = data?.kpis?.rms_vibration !== undefined ? Number(data.kpis.rms_vibration) : 0.0;
  const rawAcoustic = data?.kpis?.acoustic_db !== undefined ? Number(data.kpis.acoustic_db) : 0.0;
  const rawAlerts = data?.kpis?.active_alerts !== undefined ? Number(data.kpis.active_alerts) : (isTripped ? 1 : 0);
  const rawCurrent = data?.kpis?.motor_current !== undefined ? Number(data.kpis.motor_current) : 0.0;

  const avgTemp = failureStage === 3 ? rawAvgTemp + 32 : failureStage === 2 ? rawAvgTemp + 20 : failureStage === 1 ? rawAvgTemp + 10 : rawAvgTemp;
  const maxTemp = failureStage === 3 ? 88.6 : failureStage === 2 ? 74.8 : failureStage === 1 ? 58.4 : rawMaxTemp;
  const vibration = failureStage === 3 ? 8.4 : failureStage === 2 ? 6.2 : failureStage === 1 ? 3.6 : rawVibration;
  const acoustic = failureStage === 3 ? 94.2 : failureStage === 2 ? 82.5 : rawAcoustic;
  const alerts = isTripped ? Math.max(1, rawAlerts) : failureStage === 3 ? 4 : failureStage === 2 ? 2 : failureStage === 1 ? 1 : rawAlerts;
  const motorCurrent = isTripped ? 0.0 : failureStage === 3 ? 0.0 : failureStage === 2 ? 2.45 : failureStage === 1 ? 1.85 : rawCurrent;

  const thermalZones = (data?.thermal_zones || []).map((zone) => {
    if (failureStage > 0 && (zone.id === 'bearing_1' || zone.id === 'motor_1')) {
      const addedTemp = failureStage === 3 ? 34 : failureStage === 2 ? 20 : 10;
      return { ...zone, temperature: Number((zone.temperature + addedTemp).toFixed(1)) };
    }
    return zone;
  });

  const handleOpenTwin = (e) => {
    e.preventDefault();
    setHasVisitedTwin(true);
    setCurrentView('digital-twin');
  };

  const handleOpenCameras = (e) => {
    e.preventDefault();
    setHasVisitedCameras(true);
    setCurrentView('cameras');
  };

  const handleBackToDashboard = () => setCurrentView('dashboard');

  const jointComponents = data?.joints
    ? data.joints.map((j) => ({
        name: j.name,
        condition: isTripped ? 'critical' : j.state.toLowerCase(),
        temperature: `${j.temperature.toFixed(1)} °C`,
        vibration: `${j.vibration.toFixed(1)} mm/s`,
        lastCheck: 'Just now',
      }))
    : defaultComponents;

  return (
    <>
      {/* Digital Twin page */}
      {hasVisitedTwin && (
        <div style={{ display: currentView === 'digital-twin' ? 'block' : 'none' }}>
          <DigitalTwinPage onBack={handleBackToDashboard} telemetryData={data} />
        </div>
      )}

      {/* Camera Monitoring page */}
      {hasVisitedCameras && (
        <div style={{ display: currentView === 'cameras' ? 'block' : 'none' }}>
          <CameraPage onBack={handleBackToDashboard} telemetryData={data} />
        </div>
      )}

      {/* Main dashboard view */}
      <div style={{ display: currentView === 'dashboard' ? 'block' : 'none' }}>
        <div className="app-shell">
          <aside className="sidebar">
            <h2>Control Room</h2>
            <nav>
              <a
                className={currentView === 'dashboard' ? 'active' : ''}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentView('dashboard');
                }}
              >
                Overview
              </a>
              <a href="#" onClick={handleOpenCameras}>
                📷 ESP32 Cameras
              </a>
              <a href="#" onClick={handleOpenTwin}>
                Digital Twin
              </a>
              <a href="#">Thermal Map</a>
              <a href="#">Vibration</a>
              <a href="#">Alerts</a>
              <button
                id="theme-toggle"
                className="theme-toggle-btn"
                aria-label="Toggle Dark Mode"
                onClick={toggleTheme}
              >
                <span className="icon">🌓</span>
                <span className="text">{isLight ? 'Switch to Dark' : 'Switch to Light'}</span>
              </button>
            </nav>
          </aside>

          <main className="main-content">
            <header className="topbar">
              <div>
                <h1>System Overview</h1>
                <p id="last-updated">{data ? `Last updated: ${timestamp}` : timestamp}</p>
              </div>

              {/* Status and Relay Badge Group */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <RelayStatusBadge relayState={relayState} isLive={isLive} isWsConnected={isWsConnected} />
                <div id="system-status" className={`status-badge ${systemStatus}`}>
                  {systemStatus.toUpperCase()}
                </div>
              </div>
            </header>

            {/* Hardware Motor Control & Auto-Cutoff Panel */}
            <EmergencyStopPanel
              relayState={relayState}
              onCutoff={handleCutoff}
              onReset={handleReset}
              isPending={isPending}
            />

            <div className="widget health-score-widget" aria-labelledby="health-score-title">
              <div className="health-layout">
                <div className="health-column">
                  <HealthScore avgTemp={avgTemp} maxTemp={maxTemp} vibration={vibration} alerts={alerts} />
                </div>

                <div className="twin-column" id="digital-twin">
                  <div className="panel thermal-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="panel-header">
                      <h2>Digital Twin Preview</h2>
                      <span>{isLive ? 'Real hardware telemetry' : 'Simulation mode'}</span>
                    </div>
                    <div
                      className="twin-container"
                      style={{
                        width: '100%',
                        height: '300px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <DigitalTwinCanvas ref={twinRef} simulateFailure={failureStage} telemetryData={data} />
                      <div id="twin-telemetry-overlay" className="twin-telemetry-overlay">
                        <div className="telemetry-line">
                          Temp: <span id="twin-val-temp">{avgTemp.toFixed(1)}°C</span>
                        </div>
                        <div className="telemetry-line">
                          Vibration:{' '}
                          <span id="twin-val-vibration">
                            {vibration < 3 ? 'normal' : vibration < 5 ? 'elevated' : 'critical'}
                          </span>
                        </div>
                        <div className="telemetry-line">
                          Noise: <span>{acoustic < 75 ? 'normal' : acoustic < 88 ? 'moderate' : 'high'}</span>
                        </div>
                        <div className="telemetry-line">
                          Current:{' '}
                          <span id="twin-val-current">
                            {isTripped ? '0.00 A (TRIPPED)' : `${motorCurrent.toFixed(2)} A`}
                          </span>
                        </div>
                      </div>

                      {/* Overlay Controls */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '10px',
                          right: '10px',
                          display: 'flex',
                          gap: '10px',
                          zIndex: 10,
                        }}
                      >
                        <button
                          onClick={handleResetCamera}
                          style={{
                            background: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Reset Camera
                        </button>
                        <button
                          onClick={handleToggleFailure}
                          style={{
                            background:
                              failureStage === 3 ? '#ef4444' : failureStage > 0 ? '#f59e0b' : 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          {failureStage === 0 && 'Simulate Failure Trip'}
                          {failureStage === 1 && 'Stage 1: Minor Defect'}
                          {failureStage === 2 && 'Stage 2: High Stress'}
                          {failureStage === 3 && 'Reset Simulation'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Widgets Strip including Motor Current, Vibration/Shock, and Acoustic/Noise */}
            <section
              className="widget-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              <TemperatureGauge title="Average Temperature" icon="🌡" value={avgTemp} id="average-temperature" />
              <TemperatureGauge title="Maximum Temperature" icon="🔥" value={maxTemp} id="maximum-temperature" />
              <CurrentMeter value={motorCurrent} />
              <VibrationMeter value={vibration} />
              <AcousticMeter value={acoustic} />
              <AlertRing count={alerts} />
            </section>

            <section className="dashboard-grid">
              <div className="panel chart-panel">
                <div className="panel-header">
                  <h2>Vibration Telemetry</h2>
                  <span className="live-indicator">● {isLive ? 'LIVE MQTT' : 'SIMULATION'}</span>
                </div>
                <div className="chart-wrapper">
                  <VibrationChart value={vibration} />
                </div>
              </div>

              <div className="panel digital-twin-panel">
                <div className="panel-header">
                  <h2>Digital Twin Status</h2>
                  <span id="twin-status">
                    {isTripped
                      ? 'Relay Tripped'
                      : failureStage === 3
                      ? 'Critical Failure'
                      : failureStage === 2
                      ? 'Severe Warning'
                      : failureStage === 1
                      ? 'Minor Defect'
                      : 'Healthy'}
                  </span>
                </div>
                <DigitalTwinStatus components={jointComponents} />
              </div>

              <div className="panel degradation-panel">
                <div className="panel-header">
                  <div>
                    <h2>Degradation Progression</h2>
                    <span className="panel-subtitle">Splice condition stages</span>
                  </div>
                  <span className="stage-status">STAGE {failureStage}</span>
                </div>
                <DegradationTimeline activeStage={failureStage} />
              </div>

              <div className="panel thermal-panel">
                <div className="panel-header">
                  <h2>Thermal Map</h2>
                  <span>{isLive ? 'Sensors online' : 'Live simulation'}</span>
                </div>
                <ThermalMap zones={thermalZones} />
              </div>
            </section>

            {alertActive && (
              <TwinAlertOverlay
                isActive={alertActive}
                alertData={{
                  jointName: 'Joint 3 (Splice C)',
                  riskPercent: 96,
                  reason: 'Autonomous Cutoff Triggered',
                }}
                onDismiss={() => {
                  if (appSimTimerRef.current) {
                    clearTimeout(appSimTimerRef.current.t1);
                    clearTimeout(appSimTimerRef.current.t2);
                    appSimTimerRef.current = null;
                  }
                  setFailureStage(0);
                  setAlertActive(false);
                  triggerReset().catch(() => {});
                }}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
