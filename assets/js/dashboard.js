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
            animation: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "mm/s"
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

function updateDashboard(data) {
    document.getElementById("average-temperature").textContent =
        `${data.kpis.average_temperature} °C`;

    document.getElementById("maximum-temperature").textContent =
        `${data.kpis.maximum_temperature} °C`;

    document.getElementById("rms-vibration").textContent =
        `${data.kpis.rms_vibration} mm/s`;

    document.getElementById("active-alerts").textContent =
        data.kpis.active_alerts;

    document.getElementById("system-status").textContent =
        data.system_status.toUpperCase();

    document.getElementById("system-status").className =
        `status-badge ${data.system_status}`;

    document.getElementById("last-updated").textContent =
        `Last updated: ${data.timestamp}`;

    updateThermalMap(data.thermal_zones);

    const currentTime = new Date().toLocaleTimeString();

    chartLabels.push(currentTime);
    vibrationValues.push(data.vibration.rms);

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
