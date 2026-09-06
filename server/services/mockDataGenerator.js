export function randomFloat(min, max, precision = 2) {
    const value = min + Math.random() * (max - min);
    return Number(value.toFixed(precision));
}

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateMockTelemetry() {
    const temperature = randomFloat(43.5, 58.2);
    const vibration = randomFloat(1.8, 3.4);

    let status = "normal";

    const now = new Date();
    // PHP date format: "Y-m-d H:i:s"
    const timestamp = now.getFullYear() + "-" + 
        String(now.getMonth() + 1).padStart(2, '0') + "-" +
        String(now.getDate()).padStart(2, '0') + " " +
        String(now.getHours()).padStart(2, '0') + ":" +
        String(now.getMinutes()).padStart(2, '0') + ":" +
        String(now.getSeconds()).padStart(2, '0');

    return {
        timestamp: timestamp,
        system_status: status,
        kpis: {
            average_temperature: randomFloat(42.5, 49.8),
            maximum_temperature: temperature,
            rms_vibration: vibration,
            motor_current: randomFloat(1.25, 1.48),
            online_sensors: 14,
            total_sensors: 14,
            active_alerts: 0
        },
        thermal_zones: [
            {
                id: "motor_1",
                name: "Motor 1",
                temperature: randomFloat(44.2, 52.8)
            },
            {
                id: "bearing_1",
                name: "Bearing 1",
                temperature: randomFloat(48.5, 59.4)
            },
            {
                id: "pump_1",
                name: "Pump 1",
                temperature: randomFloat(41.0, 48.6)
            },
            {
                id: "fan_1",
                name: "Fan 1",
                temperature: randomFloat(36.5, 43.2)
            }
        ],
        vibration: {
            rms: vibration,
            peak: randomFloat(2.8, 4.5),
            frequency: randomFloat(48, 54)
        },
        joints: [
            {
                id: "joint_1",
                name: "Joint 1 (Splice A)",
                state: "NORMAL",
                riskPercent: randomInt(6, 12),
                temperature: randomFloat(41.2, 46.8),
                vibration: randomFloat(1.2, 1.8),
                gapWidth: randomFloat(1.6, 2.0),
                wearLevel: randomFloat(12, 18),
                tension: randomFloat(94, 98)
            },
            {
                id: "joint_2",
                name: "Joint 2 (Splice B)",
                state: "NORMAL",
                riskPercent: randomInt(14, 24),
                temperature: randomFloat(50.4, 56.8),
                vibration: randomFloat(2.4, 3.2),
                gapWidth: randomFloat(2.4, 3.0),
                wearLevel: randomFloat(28, 36),
                tension: randomFloat(88, 93)
            },
            {
                id: "joint_3",
                name: "Joint 3 (Splice C)",
                state: "NORMAL",
                riskPercent: randomInt(4, 9),
                temperature: randomFloat(39.5, 43.8),
                vibration: randomFloat(0.9, 1.4),
                gapWidth: randomFloat(1.2, 1.7),
                wearLevel: randomFloat(8, 14),
                tension: randomFloat(96, 99)
            },
            {
                id: "joint_4",
                name: "Joint 4 (Splice D)",
                state: "NORMAL",
                riskPercent: randomInt(18, 30),
                temperature: randomFloat(54.2, 62.5),
                vibration: randomFloat(2.8, 3.7),
                gapWidth: randomFloat(2.9, 3.6),
                wearLevel: randomFloat(34, 44),
                tension: randomFloat(84, 91)
            }
        ]
    };
}
