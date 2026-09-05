/**
 * motor.js
 * 
 * Procedural motor + gearbox assembly positioned at the drive end of the conveyor.
 * Built from BoxGeometry and CylinderGeometry primitives.
 */

import * as THREE from 'three';
import { DIMENSIONS } from './conveyor.js';

/**
 * Creates the motor and gearbox assembly.
 * @returns {{ motorGroup: THREE.Group, motorState: { running: boolean } }}
 */
export function createMotor() {
  const motorGroup = new THREE.Group();
  motorGroup.name = 'Motor';

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x4b5563,
    roughness: 0.35,
    metalness: 0.85,
  });

  const motorBodyMat = new THREE.MeshStandardMaterial({
    color: 0x374151,
    roughness: 0.4,
    metalness: 0.7,
  });

  const coppperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    roughness: 0.3,
    metalness: 0.9,
  });

  // --- Motor Housing (main body) ---
  const motorBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.6, 0.7),
    motorBodyMat
  );
  motorBody.castShadow = true;
  motorGroup.add(motorBody);

  // Motor top fin/heatsink lines
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.02, 0.05),
      steelMat
    );
    fin.position.set(0, 0.31, -0.25 + i * 0.15);
    fin.castShadow = true;
    motorGroup.add(fin);
  }

  // --- Motor shaft (extends toward conveyor) ---
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12),
    steelMat
  );
  shaft.rotation.x = Math.PI / 2;
  shaft.position.set(0, 0, 0.65);
  shaft.castShadow = true;
  motorGroup.add(shaft);

  // --- Gearbox (between motor and conveyor) ---
  const gearbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.45, 0.4),
    steelMat
  );
  gearbox.position.set(0, -0.05, 0.9);
  gearbox.castShadow = true;
  motorGroup.add(gearbox);

  // Gearbox output shaft
  const gearShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12),
    coppperMat
  );
  gearShaft.rotation.x = Math.PI / 2;
  gearShaft.position.set(0, 0, 1.2);
  gearShaft.castShadow = true;
  motorGroup.add(gearShaft);

  // --- Motor mounting plate ---
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.06, 0.9),
    steelMat
  );
  plate.position.set(0, -0.33, 0.3);
  plate.castShadow = true;
  motorGroup.add(plate);

  // --- Position the motor assembly at the drive end of the conveyor ---
  const halfLength = DIMENSIONS.length / 2;
  const halfWidth = DIMENSIONS.width / 2;
  motorGroup.position.set(
    -halfLength + 0.3,       // At the drive roller end
    DIMENSIONS.height - 0.1, // Aligned with frame height
    -halfWidth - 0.7         // Just outside the right rail
  );

  // Motor state — shared mutable object used by animation loop
  const motorState = { running: true };

  return { motorGroup, motorState };
}
