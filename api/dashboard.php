<?php

header('Content-Type: application/json');

function randomFloat($minimum, $maximum, $precision = 2) {
    return round($minimum + (mt_rand() / mt_getrandmax()) * ($maximum - $minimum), $precision);
}

$temperature = randomFloat(42, 88);
$vibration = randomFloat(1.2, 8.5);

if ($temperature >= 85 || $vibration >= 7) {
    $status = "critical";
} elseif ($temperature >= 70 || $vibration >= 5) {
    $status = "warning";
} else {
    $status = "normal";
}

$response = [
    "timestamp" => date("Y-m-d H:i:s"),
    "system_status" => $status,

    "kpis" => [
        "average_temperature" => randomFloat(48, 68),
        "maximum_temperature" => $temperature,
        "rms_vibration" => $vibration,
        "online_sensors" => 12,
        "total_sensors" => 14,
        "active_alerts" => random_int(0, 5)
    ],

    "thermal_zones" => [
        [
            "id" => "motor_1",
            "name" => "Motor 1",
            "temperature" => randomFloat(45, 65)
        ],
        [
            "id" => "bearing_1",
            "name" => "Bearing 1",
            "temperature" => randomFloat(55, 90)
        ],
        [
            "id" => "pump_1",
            "name" => "Pump 1",
            "temperature" => randomFloat(40, 75)
        ],
        [
            "id" => "fan_1",
            "name" => "Fan 1",
            "temperature" => randomFloat(35, 60)
        ]
    ],

    "vibration" => [
        "rms" => $vibration,
        "peak" => randomFloat(4, 12),
        "frequency" => randomFloat(40, 65)
    ]
];

echo json_encode($response);
