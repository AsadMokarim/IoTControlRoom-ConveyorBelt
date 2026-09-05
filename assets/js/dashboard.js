const chartLabels = [];
const vibrationValues = [];

const vibrationChart = new Chart(
    document.getElementById("vibration-chart"),
    {
        type: "line",
        data: {
            labels: chartLabels,
            datasets: [{
                label: "RMS Vibration",
                data: vibrationValues,
                borderColor: "#38bdf8",
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                fill: true,
                tension: 0.35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            interaction: {
                intersect: false,
                mode: "index"
            },

            scales: {
                x: {
                    grid: {
                        color: "rgba(148, 163, 184, 0.08)"
                    },
                    ticks: {
                        color: "#7890aa",
                        maxTicksLimit: 6
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(148, 163, 184, 0.08)"
                    },
                    ticks: {
                        color: "#7890aa"
                    },
                    title: {
                        display: true,
                        text: "mm/s",
                        color: "#7890aa"
                    }
                }
            }
        }

    }
);

function getTemperatureClass(temperature) {
    if (temperature >= 85) return "temperature-critical";
    if (temperature >= 70) return "temperature-warning";
    if (temperature >= 55) return "temperature-moderate";
    return "temperature-normal";
}

function updateThermalMap(zones) {
    const thermalMap = document.getElementById("thermal-map");
    thermalMap.innerHTML = "";

    zones.forEach(zone => {
        const tile = document.createElement("div");

        tile.className = `thermal-tile ${getTemperatureClass(zone.temperature)}`;

        tile.innerHTML = `
            <span>${zone.name}</span>
            <strong>${zone.temperature} °C</strong>
        `;

        thermalMap.appendChild(tile);
    });
}

function clamp(value, min, max) {
    return Math.min(Math.max(Number(value) || 0, min), max);
}

function updateGauge(id, value, maximum = 100) {
    const gauge = document.getElementById(id);
    const percentage = clamp(value, 0, maximum) / maximum;

    // The visible gauge covers 270 degrees.
    const degrees = `${percentage * 270}deg`;

    gauge.style.setProperty("--value", degrees);

    if (value >= 85) {
        gauge.style.setProperty("--gauge-color", "#ef4444");
    } else if (value >= 70) {
        gauge.style.setProperty("--gauge-color", "#facc15");
    } else {
        gauge.style.setProperty("--gauge-color", "#38bdf8");
    }
}

function updateVibrationMeter(value) {
    const meterBars = document.querySelectorAll("#vibration-meter span");

    // Adjust this according to the expected maximum vibration.
    const percentage = clamp(value, 0, 20) / 20;
    const activeBars = Math.ceil(percentage * meterBars.length);

    meterBars.forEach((bar, index) => {
        const isActive = index < activeBars;

        bar.style.opacity = isActive ? "1" : "0.15";

        if (value >= 15 && isActive) {
            bar.style.background = "#ef4444";
        } else if (value >= 8 && isActive) {
            bar.style.background = "#facc15";
        } else if (isActive) {
            bar.style.background = "#38bdf8";
        }
    });
}

function updateAlertRing(alertCount) {
    const ring = document.getElementById("alert-ring");
    const summary = document.getElementById("alert-summary");

    const count = Number(alertCount) || 0;
    const ringPercentage = count === 0 ? 100 : Math.max(15, 100 - count * 18);
    const degrees = ringPercentage * 3.6;

    if (count === 0) {
        ring.style.background = `
            conic-gradient(
                #22c55e 0deg,
                #22c55e ${degrees}deg,
                rgba(255,255,255,0.08) ${degrees}deg
            )
        `;

        summary.textContent = "System monitoring normally";
    } else {
        ring.style.background = `
            conic-gradient(
                #ef4444 0deg,
                #ef4444 ${degrees}deg,
                rgba(255,255,255,0.08) ${degrees}deg
            )
        `;

        summary.textContent = `${count} alert${count === 1 ? "" : "s"} require attention`;
    }
}

function updateDashboard(data) {
    const averageTemperature = Number(data.kpis.average_temperature) || 0;
    const maximumTemperature = Number(data.kpis.maximum_temperature) || 0;
    const vibration = Number(data.kpis.rms_vibration) || 0;
    const activeAlerts = Number(data.kpis.active_alerts) || 0;

    document.getElementById("average-temperature").textContent =
        averageTemperature.toFixed(1);

    document.getElementById("maximum-temperature").textContent =
        maximumTemperature.toFixed(1);

    document.getElementById("rms-vibration").textContent =
        vibration.toFixed(2);

    document.getElementById("active-alerts").textContent =
        activeAlerts;

    updateGauge(
        "average-temperature-gauge",
        averageTemperature,
        100
    );

    updateGauge(
        "maximum-temperature-gauge",
        maximumTemperature,
        100
    );

    updateVibrationMeter(vibration);
    updateAlertRing(activeAlerts);

    document.getElementById("system-status").textContent =
        data.system_status.toUpperCase();

    document.getElementById("system-status").className =
        `status-badge ${data.system_status}`;

    document.getElementById("last-updated").textContent =
        `Last updated: ${data.timestamp}`;

    updateThermalMap(data.thermal_zones);

    const currentTime = new Date().toLocaleTimeString();

    chartLabels.push(currentTime);
    vibrationValues.push(vibration);

    if (chartLabels.length > 20) {
        chartLabels.shift();
        vibrationValues.shift();
    }

    vibrationChart.update();
}


async function loadDashboardData() {
    try {
        const response = await fetch("api/dashboard.php");
        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        document.getElementById("system-status").textContent = "OFFLINE";
        console.error("Dashboard data error:", error);
    }
}

loadDashboardData();
setInterval(loadDashboardData, 2000);
