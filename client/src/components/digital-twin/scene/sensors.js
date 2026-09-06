/**
 * sensors.js
 * 
 * Sensor marker objects placed on the 3D conveyor model.
 * Each marker is a small sphere that can be clicked to show sensor info.
 * 
 * Sensors:
 *  - Vibration (MPU6050) — mounted near Joint 3
 *  - Temperature (DS18B20) — mounted on belt frame
 *  - Motor Current (ACS712) — mounted near motor
 *  - Camera (ESP32-CAM) — mounted on overhead frame
 */

import * as THREE from 'three';
import { DIMENSIONS } from './conveyor.js';

const SENSOR_DEFS = [
  {
    id: 'vibration',
    name: 'Vibration Sensor',
    model: 'MPU6050',
    description: 'Vibration / Misalignment Detection',
    unit: 'g',
    position: { x: 1.0, y: DIMENSIONS.beltY + 0.15, z: DIMENSIONS.width / 2 + 0.2 },
    color: 0x3b82f6, // blue
  },
  {
    id: 'temperature',
    name: 'Temperature Sensor',
    model: 'DS18B20',
    description: 'Belt Surface Temperature',
    unit: '°C',
    position: { x: -1.0, y: DIMENSIONS.beltY + 0.15, z: DIMENSIONS.width / 2 + 0.2 },
    color: 0xf97316, // orange
  },
  {
    id: 'motorCurrent',
    name: 'Motor Current Sensor',
    model: 'ACS712',
    description: 'Motor Current Draw',
    unit: 'A',
    position: { x: -DIMENSIONS.length / 2 + 0.5, y: DIMENSIONS.height + 0.3, z: -DIMENSIONS.width / 2 - 0.4 },
    color: 0xa855f7, // purple
  },
  {
    id: 'camera',
    name: 'Inspection Camera',
    model: 'ESP32-CAM',
    description: 'Visual Belt Inspection',
    unit: '',
    position: { x: 0, y: DIMENSIONS.beltY + 3.5, z: 0 },
    color: 0x06b6d4, // cyan
  },
];

/**
 * Creates a specific sensor mesh based on its ID.
 */
function buildSensorModel(def) {
  const group = new THREE.Group();

  // Materials
  const primaryMat = new THREE.MeshStandardMaterial({
    color: def.color,
    roughness: 0.3,
    metalness: 0.8,
  });
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.8,
  });
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.4,
    metalness: 0.9,
  });

  if (def.id === 'vibration') {
    // MPU6050 (PCB + Chip)
    const pcbGeo = new THREE.BoxGeometry(0.12, 0.02, 0.08);
    const pcb = new THREE.Mesh(pcbGeo, primaryMat);
    pcb.position.y = 0.01;
    group.add(pcb);

    const chipGeo = new THREE.BoxGeometry(0.05, 0.02, 0.05);
    const chip = new THREE.Mesh(chipGeo, blackMat);
    chip.position.y = 0.03;
    group.add(chip);

  } else if (def.id === 'temperature') {
    // DS18B20 (Cylindrical Probe)
    const probeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 12);
    const probe = new THREE.Mesh(probeGeo, silverMat);
    probe.position.y = 0.06;
    group.add(probe);
    
    const baseGeo = new THREE.BoxGeometry(0.06, 0.02, 0.06);
    const base = new THREE.Mesh(baseGeo, primaryMat);
    base.position.y = 0.01;
    group.add(base);

  } else if (def.id === 'motorCurrent') {
    // ACS712 (Module block)
    const baseGeo = new THREE.BoxGeometry(0.15, 0.04, 0.12);
    const base = new THREE.Mesh(baseGeo, primaryMat);
    base.position.y = 0.02;
    group.add(base);

    const terminalGeo = new THREE.BoxGeometry(0.06, 0.05, 0.1);
    const terminal = new THREE.Mesh(terminalGeo, blackMat);
    terminal.position.set(-0.03, 0.065, 0);
    group.add(terminal);

  } else if (def.id === 'camera') {
    // ESP32-CAM (Hollow cone at front + cuboid body)
    const bodyGeo = new THREE.BoxGeometry(0.12, 0.1, 0.2);
    const body = new THREE.Mesh(bodyGeo, silverMat);
    group.add(body);

    // Hollow cone (lens hood) at the front (facing -Z)
    const hoodGeo = new THREE.CylinderGeometry(0.06, 0.03, 0.1, 16, 1, true);
    hoodGeo.rotateX(-Math.PI / 2);
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.set(0, 0, -0.15);
    group.add(hood);
    
    // Lens inside the hood
    const lensGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 12);
    lensGeo.rotateX(Math.PI / 2);
    const lensMat = new THREE.MeshStandardMaterial({
      color: def.color,
      emissive: def.color,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.8
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0, -0.105);
    group.add(lens);

    // Point camera straight down at the belt
    group.rotation.x = -Math.PI / 2;
  }

  // Tag all meshes for raycasting
  group.children.forEach(child => {
    child.userData = { type: 'sensor', sensorId: def.id };
    child.castShadow = true;
  });

  return group;
}

/**
 * Creates sensor marker meshes on the conveyor.
 * @returns {{ sensorsGroup: THREE.Group, sensorObjects: SensorObject[] }}
 */
export function createSensors() {
  const sensorsGroup = new THREE.Group();
  sensorsGroup.name = 'Sensors';

  const sensorObjects = [];

  const SENSOR_SCALE = 2.5; // Scale up to make sensors more visible

  for (const def of SENSOR_DEFS) {
    const marker = buildSensorModel(def);
    marker.position.set(def.position.x, def.position.y, def.position.z);
    marker.scale.set(SENSOR_SCALE, SENSOR_SCALE, SENSOR_SCALE);
    sensorsGroup.add(marker);

    // Small outer glow ring for UI highlights
    const glowGeo = new THREE.RingGeometry(0.08, 0.12, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(marker.position);
    // Camera is floating overhead, so place the glow slightly below its bounding area
    glow.position.y += (def.id === 'camera' ? -0.15 * SENSOR_SCALE : 0.001);
    glow.rotation.x = -Math.PI / 2;
    glow.scale.set(SENSOR_SCALE, SENSOR_SCALE, SENSOR_SCALE);
    glow.userData = { type: 'sensor', sensorId: def.id };
    sensorsGroup.add(glow);

    sensorObjects.push({
      ...def,
      marker,
      glow,
      currentReading: 0,
    });
  }

  return { sensorsGroup, sensorObjects };
}

/**
 * Returns all raycastable sensor meshes.
 */
export function getSensorRaycastTargets(sensorObjects) {
  const targets = [];
  for (const s of sensorObjects) {
    if (s.marker.isGroup) {
      targets.push(...s.marker.children);
    } else {
      targets.push(s.marker);
    }
    targets.push(s.glow);
  }
  return targets;
}
