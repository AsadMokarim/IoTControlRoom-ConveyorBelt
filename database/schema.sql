CREATE DATABASE iot_dashboard;

USE iot_dashboard;

CREATE TABLE sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_code VARCHAR(50) UNIQUE NOT NULL,
    sensor_name VARCHAR(100) NOT NULL,
    sensor_type VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    status ENUM('online', 'offline', 'warning') DEFAULT 'online',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sensor_readings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    temperature DECIMAL(8,2),
    vibration_rms DECIMAL(8,2),
    vibration_peak DECIMAL(8,2),
    frequency DECIMAL(8,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id)
);

CREATE TABLE alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT,
    severity ENUM('info', 'warning', 'critical') NOT NULL,
    message VARCHAR(255) NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id)
);
