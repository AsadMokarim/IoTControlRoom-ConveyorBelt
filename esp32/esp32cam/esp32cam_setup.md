# ESP32-CAM Video Stream Setup Guide

This guide walks you through flashing and configuring your **ESP32-CAM (AI-Thinker)** modules to stream real-time MJPEG video directly into the IoT Control Room dashboard.

---

## 1. Prerequisites

- **Board**: AI-Thinker ESP32-CAM (with OV2640 camera module).
- **Programmer**: FTDI USB-to-TTL serial adapter (set to 3.3V jumper or 5V power).
- **Arduino IDE**: Version 2.x or 1.8.x with ESP32 board support installed.

---

## 2. Wiring for Flashing

| FTDI Programmer | ESP32-CAM Pin | Note |
| :--- | :--- | :--- |
| **VCC (5V)** | **5V** | ESP32-CAM works best with a clean 5V supply |
| **GND** | **GND** | Common ground |
| **TX** | **U0R (GPIO 3)** | Cross TX -> RX |
| **RX** | **U0T (GPIO 1)** | Cross RX -> TX |
| **GND** | **GPIO 0** | **Connect during flashing** to enter bootloader mode |

> [!IMPORTANT]
> Remove the jumper between **GPIO 0 and GND** after uploading the sketch, then press the **RST** button to boot normally.

---

## 3. Arduino IDE Board Settings

1. Open Arduino IDE: `Tools > Board > ESP32 Arduino > AI Thinker ESP32-CAM`.
2. CPU Frequency: `240MHz (WiFi/BT)`.
3. Flash Frequency: `80MHz`.
4. Flash Mode: `QIO`.
5. Partition Scheme: `Huge APP (3MB No OTA/1MB SPIFFS)`.
6. Upload Speed: `115200` or `921600`.

---

## 4. Arduino Sketch Configuration

Open the example sketch in Arduino IDE:
`File > Examples > ESP32 > Camera > CameraWebServer`.

In `CameraWebServer.ino`:
1. Select the camera model:
   ```cpp
   #define CAMERA_MODEL_AI_THINKER // Select this line and comment all others
   ```
2. Set Wi-Fi Credentials for the Raspberry Pi Hotspot:
   ```cpp
   const char* ssid = "RaspberryPi_Hotspot";
   const char* password = "conveyor123";
   ```
3. Assign a Static IP (Recommended so the IP address remains fixed):

   **For Camera 1 (Belt Overview):**
   ```cpp
   IPAddress local_IP(192, 168, 4, 3);
   IPAddress gateway(192, 168, 4, 1);
   IPAddress subnet(255, 255, 255, 0);

   void setup() {
     Serial.begin(115200);
     WiFi.config(local_IP, gateway, subnet);
     WiFi.begin(ssid, password);
     // ... rest of setup
   }
   ```

   **For Camera 2 (Splice Joint Inspection):**
   ```cpp
   IPAddress local_IP(192, 168, 4, 4);
   IPAddress gateway(192, 168, 4, 1);
   IPAddress subnet(255, 255, 255, 0);

   void setup() {
     Serial.begin(115200);
     WiFi.config(local_IP, gateway, subnet);
     WiFi.begin(ssid, password);
     // ... rest of setup
   }
   ```

---

## 5. Streaming Resolution Optimization

For the lowest latency over Wi-Fi hotspot:
- Frame size: **VGA (640x480)** or **SVGA (800x600)**.
- JPEG Quality: `12` (range 10-63, lower number means higher quality).
- The streaming URL for each camera will be:
  - Camera 1: `http://192.168.4.3:81/stream`
  - Camera 2: `http://192.168.4.4:81/stream`

---

## 6. Verifying Stream

Open your browser on a laptop connected to the Raspberry Pi hotspot and navigate to:
`http://192.168.4.3:81/stream`

You should immediately see the live MJPEG video stream. Once verified, open the IoT Control Room dashboard at `http://192.168.4.1:3001` and click **📷 ESP32 Cameras** in the sidebar.
