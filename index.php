<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IoT Control Room</title>
    <link rel="stylesheet" href="assets/css/dashboard.css">
</head>
<body>

<div class="app-shell">

    <aside class="sidebar">
        <h2>Control Room</h2>

        <nav>
            <a class="active" href="#">Overview</a>
            <a href="#">Thermal Map</a>
            <a href="#">Vibration</a>
            <a href="http://localhost:5173">Digital Twin</a>
            <a href="#">Sensors</a>
            <a href="#">Alerts</a>
            <button id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle Dark Mode">
              <span class="icon">🌓</span>
              <span class="text">Switch to Light</span>
            </button>
        </nav>
    </aside>

    <main class="main-content">
        <header class="topbar">
            <div>
                <h1>System Overview</h1>
                <p id="last-updated">Waiting for data...</p>
            </div>

            <div id="system-status" class="status-badge">
                Connecting
            </div>
        </header>

        <div class="widget health-score-widget">
            <div class="widget-title">
                <span>Overall Health Score</span>
            </div>

            <div class="health-score-container">
                <div class="health-score-ring" id="health-score-ring">
                    <div class="health-score-inner">
                        <strong id="health-score">--</strong>
                        <small>/ 100</small>
                    </div>
                </div>

                <div class="health-score-label" id="health-score-label">
                    Calculating...
                </div>
            </div>

            <div class="health-score-formula">
                <span>Based on</span>

                <div class="health-score-links">
                    <a href="#average-temperature-gauge">
                        <span class="formula-icon">🌡</span>
                        Temperature
                    </a>

                    <a href="#maximum-temperature-gauge">
                        <span class="formula-icon">🔥</span>
                        Max Temp
                    </a>

                    <a href="#vibration-meter">
                        <span class="formula-icon">〽</span>
                        Vibration
                    </a>

                    <a href="#alert-ring">
                        <span class="formula-icon">⚠</span>
                        Alerts
                    </a>
                </div>
            </div>
        </div>

        <section class="widget-grid">



            <div class="widget gauge-widget">
                <div class="widget-title">
                    <span>Average Temperature</span>
                    <span class="widget-icon">🌡</span>
                </div>

                <div class="gauge"
                     id="average-temperature-gauge"
                     style="--value: 0deg; --gauge-color: #38bdf8;">
                    <div class="gauge-inner">
                        <strong id="average-temperature">--</strong>
                        <small>°C</small>
                    </div>
                </div>

                <div class="scale">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                </div>
            </div>

            <div class="widget gauge-widget">
                <div class="widget-title">
                    <span>Maximum Temperature</span>
                    <span class="widget-icon">🔥</span>
                </div>

                <div class="gauge"
                     id="maximum-temperature-gauge"
                     style="--value: 0deg; --gauge-color: #22c55e;">
                    <div class="gauge-inner">
                        <strong id="maximum-temperature">--</strong>
                        <small>°C</small>
                    </div>
                </div>

                <div class="scale">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                </div>
            </div>

            <div class="widget meter-widget">
                <div class="widget-title">
                    <span>RMS Vibration</span>
                    <span class="widget-icon">〽</span>
                </div>

                <div class="audio-meter" id="vibration-meter">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

                <div class="meter-value">
                    <strong id="rms-vibration">--</strong>
                    <small>mm/s</small>
                </div>
            </div>

            <div class="widget alert-widget">
                <div class="widget-title">
                    <span>Active Alerts</span>
                    <span class="widget-icon">⚠</span>
                </div>

                <div class="alert-ring" id="alert-ring">
                    <div>
                        <strong id="active-alerts">--</strong>
                        <small>ACTIVE</small>
                    </div>
                </div>

                <div id="alert-summary">System monitoring normally</div>
            </div>

        </section>


        <section class="dashboard-grid">



            <div class="panel thermal-panel">
                <div class="panel-header">
                    <h2>Thermal Map</h2>
                    <span>Live simulation</span>
                </div>

                <div id="thermal-map" class="thermal-map"></div>
            </div>

            <div class="panel chart-panel">
                <div class="panel-header">
                    <h2>Vibration Telemetry</h2>
                    <span class="live-indicator">● LIVE</span>
                </div>

                <div class="chart-wrapper">
                    <canvas id="vibration-chart"></canvas>
                </div>
            </div>


            <div class="panel digital-twin-panel">
                <div class="panel-header">
                    <h2>Digital Twin Status</h2>
                    <span id="twin-status">Healthy</span>
                </div>

                <div class="digital-twin-table-wrapper">
                    <table class="digital-twin-table">
                        <thead>
                            <tr>
                                <th>Component</th>
                                <th>Condition</th>
                                <th>Temperature</th>
                                <th>Vibration</th>
                                <th>Last Check</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td>
                                    <div class="component-name">
                                        <span class="component-dot normal"></span>
                                        Motor 1
                                    </div>
                                </td>
                                <td>
                                    <span class="condition-badge normal">Normal</span>
                                </td>
                                <td>42.6 °C</td>
                                <td>1.8 mm/s</td>
                                <td>Just now</td>
                            </tr>

                            <tr>
                                <td>
                                    <div class="component-name">
                                        <span class="component-dot warning"></span>
                                        Bearing 1
                                    </div>
                                </td>
                                <td>
                                    <span class="condition-badge warning">Warning</span>
                                </td>
                                <td>68.4 °C</td>
                                <td>4.9 mm/s</td>
                                <td>Just now</td>
                            </tr>

                            <tr>
                                <td>
                                    <div class="component-name">
                                        <span class="component-dot normal"></span>
                                        Pump 1
                                    </div>
                                </td>
                                <td>
                                    <span class="condition-badge normal">Normal</span>
                                </td>
                                <td>39.8 °C</td>
                                <td>1.2 mm/s</td>
                                <td>2 min ago</td>
                            </tr>

                            <tr>
                                <td>
                                    <div class="component-name">
                                        <span class="component-dot offline"></span>
                                        Fan 1
                                    </div>
                                </td>
                                <td>
                                    <span class="condition-badge offline">Offline</span>
                                </td>
                                <td>--</td>
                                <td>--</td>
                                <td>18 min ago</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>

            <div class="panel degradation-panel">
                <div class="panel-header">
                    <div>
                        <h2>Degradation Progression</h2>
                        <span class="panel-subtitle">Splice condition stages</span>
                    </div>

                    <span class="stage-status">STAGE 0</span>
                </div>

                <div class="degradation-timeline">

                    <div class="degradation-stage active">
                        <div class="stage-marker">
                            <span>0</span>
                        </div>

                        <div class="stage-content">
                            <span class="stage-label">Stage 0</span>
                            <strong>Healthy splice</strong>
                            <p>Normal operating condition with no detected degradation.</p>
                        </div>
                    </div>

                    <div class="timeline-connector"></div>

                    <div class="degradation-stage">
                        <div class="stage-marker">
                            <span>1</span>
                        </div>

                        <div class="stage-content">
                            <span class="stage-label">Stage 1</span>
                            <strong>Minor artificial defect</strong>
                            <p>Early defect signature detected during monitoring.</p>
                        </div>
                    </div>

                    <div class="timeline-connector"></div>

                    <div class="degradation-stage">
                        <div class="stage-marker">
                            <span>2</span>
                        </div>

                        <div class="stage-content">
                            <span class="stage-label">Stage 2</span>
                            <strong>Partial splice weakening</strong>
                            <p>Structural performance is beginning to deteriorate.</p>
                        </div>
                    </div>

                    <div class="timeline-connector"></div>

                    <div class="degradation-stage">
                        <div class="stage-marker">
                            <span>3</span>
                        </div>

                        <div class="stage-content">
                            <span class="stage-label">Stage 3</span>
                            <strong>Severe degradation</strong>
                            <p>Critical condition requiring immediate inspection.</p>
                        </div>
                    </div>

                </div>
            </div>


        </section>
    </main>

</div>

<script src="assets/vendor/chart.js"></script>
<script src="assets/js/dashboard.js"></script>
<script src="assets/js/health-score.js"></script>
<script src="assets/js/theme.js"></script>
</body>
</html>
