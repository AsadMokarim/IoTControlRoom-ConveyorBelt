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

        <section class="kpi-grid">
            <div class="kpi-card">
                <span>Average Temperature</span>
                <strong id="average-temperature">-- °C</strong>
            </div>

            <div class="kpi-card">
                <span>Maximum Temperature</span>
                <strong id="maximum-temperature">-- °C</strong>
            </div>

            <div class="kpi-card">
                <span>RMS Vibration</span>
                <strong id="rms-vibration">-- mm/s</strong>
            </div>

            <div class="kpi-card">
                <span>Active Alerts</span>
                <strong id="active-alerts">--</strong>
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

            <div class="panel">
                <div class="panel-header">
                    <h2>Vibration Telemetry</h2>
                    <span>RMS vibration</span>
                </div>

                <canvas id="vibration-chart"></canvas>
            </div>

            <div class="panel digital-twin-panel">
                <div class="panel-header">
                    <h2>Digital Twin Status</h2>
                    <span id="twin-status">Healthy</span>
                </div>

                <div class="digital-twin">
                    <div class="machine-component normal">Motor 1</div>
                    <div class="machine-component warning">Bearing 1</div>
                    <div class="machine-component normal">Pump 1</div>
                    <div class="machine-component offline">Fan 1</div>
                </div>
            </div>

            <div class="panel">
                <div class="panel-header">
                    <h2>Recent Alerts</h2>
                </div>

                <div id="alerts-list">
                    No alerts
                </div>
            </div>

        </section>
    </main>

</div>

<script src="assets/vendor/chart.js"></script>
<script src="assets/js/dashboard.js"></script>
<script src="assets/js/theme.js"></script>
</body>
</html>
