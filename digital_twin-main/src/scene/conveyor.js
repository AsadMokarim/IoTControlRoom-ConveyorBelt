/**
 * conveyor.js
 * 
 * Procedural conveyor belt model built entirely from Three.js primitives.
 * Contains: steel frame, support legs, rollers, drive roller, conveyor belt.
 * 
 * The belt uses texture offset animation for movement.
 * Rollers rotate when the system is running.
 */

import * as THREE from 'three';

// --- Conveyor Dimensions ---
const CONVEYOR_LENGTH = 10;
const CONVEYOR_WIDTH = 2.2;
const CONVEYOR_HEIGHT = 1.8; // height of the frame from ground
const RAIL_THICKNESS = 0.12;
const LEG_WIDTH = 0.1;
const ROLLER_RADIUS = 0.15;
const ROLLER_COUNT = 5;
const BELT_THICKNESS = 0.04;

// --- Materials ---
function createMaterials() {
  const steel = new THREE.MeshStandardMaterial({
    color: 0x6b7280,
    roughness: 0.35,
    metalness: 0.85,
  });

  const steelDark = new THREE.MeshStandardMaterial({
    color: 0x4b5563,
    roughness: 0.4,
    metalness: 0.8,
  });

  const rollerMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.3,
    metalness: 0.9,
  });

  // Belt material — dark rubber with procedural texture for movement
  const beltCanvas = document.createElement('canvas');
  beltCanvas.width = 512;
  beltCanvas.height = 64;
  const ctx = beltCanvas.getContext('2d');
  
  // Base rubber color
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 512, 64);
  
  // High-contrast thick tread lines
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 4;
  for (let i = 0; i < 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 64);
    ctx.stroke();
  }
  
  // Yellow industrial edge markers for highly visible movement
  ctx.fillStyle = '#f59e0b';
  for (let i = 0; i < 512; i += 64) {
    // Top edge dashed line
    ctx.fillRect(i, 4, 32, 4);
    // Bottom edge dashed line
    ctx.fillRect(i, 56, 32, 4);
  }

  const beltTexture = new THREE.CanvasTexture(beltCanvas);
  beltTexture.wrapS = THREE.RepeatWrapping;
  beltTexture.wrapT = THREE.RepeatWrapping;
  beltTexture.repeat.set(8, 1);

  const belt = new THREE.MeshStandardMaterial({
    map: beltTexture,
    color: 0x2a2a2a,
    roughness: 0.95,
    metalness: 0.05,
  });

  return { steel, steelDark, rollerMat, belt, beltTexture };
}

/**
 * Builds the complete conveyor assembly.
 * @returns {{ 
 *   conveyorGroup: THREE.Group,
 *   rollers: THREE.Mesh[],
 *   beltMesh: THREE.Mesh,
 *   beltTexture: THREE.CanvasTexture,
 *   materials: Object
 * }}
 */
export function createConveyor() {
  const conveyorGroup = new THREE.Group();
  conveyorGroup.name = 'Conveyor';

  const materials = createMaterials();
  const rollers = [];

  const halfLength = CONVEYOR_LENGTH / 2;
  const halfWidth = CONVEYOR_WIDTH / 2;

  // =====================
  // SIDE RAILS (2x long horizontal beams)
  // =====================
  const railGeo = new THREE.BoxGeometry(CONVEYOR_LENGTH, RAIL_THICKNESS, RAIL_THICKNESS);
  
  const leftRail = new THREE.Mesh(railGeo, materials.steel);
  leftRail.position.set(0, CONVEYOR_HEIGHT, halfWidth);
  leftRail.castShadow = true;
  leftRail.name = 'Rail_Left';
  conveyorGroup.add(leftRail);

  const rightRail = new THREE.Mesh(railGeo, materials.steel);
  rightRail.position.set(0, CONVEYOR_HEIGHT, -halfWidth);
  rightRail.castShadow = true;
  rightRail.name = 'Rail_Right';
  conveyorGroup.add(rightRail);

  // Bottom side rails (lower frame)
  const bottomRailGeo = new THREE.BoxGeometry(CONVEYOR_LENGTH, RAIL_THICKNESS * 0.8, RAIL_THICKNESS * 0.8);

  const leftBottomRail = new THREE.Mesh(bottomRailGeo, materials.steelDark);
  leftBottomRail.position.set(0, CONVEYOR_HEIGHT - 0.5, halfWidth - 0.05);
  leftBottomRail.castShadow = true;
  conveyorGroup.add(leftBottomRail);

  const rightBottomRail = new THREE.Mesh(bottomRailGeo, materials.steelDark);
  rightBottomRail.position.set(0, CONVEYOR_HEIGHT - 0.5, -halfWidth + 0.05);
  rightBottomRail.castShadow = true;
  conveyorGroup.add(rightBottomRail);

  // =====================
  // SUPPORT LEGS (6 pairs)
  // =====================
  const legGeo = new THREE.BoxGeometry(LEG_WIDTH, CONVEYOR_HEIGHT, LEG_WIDTH);
  const legPositions = [-4, -2, 0, 2, 4];

  for (const xPos of legPositions) {
    // Left legs
    const leftLeg = new THREE.Mesh(legGeo, materials.steelDark);
    leftLeg.position.set(xPos, CONVEYOR_HEIGHT / 2, halfWidth);
    leftLeg.castShadow = true;
    conveyorGroup.add(leftLeg);

    // Right legs
    const rightLeg = new THREE.Mesh(legGeo, materials.steelDark);
    rightLeg.position.set(xPos, CONVEYOR_HEIGHT / 2, -halfWidth);
    rightLeg.castShadow = true;
    conveyorGroup.add(rightLeg);

    // Cross braces between legs
    const braceGeo = new THREE.BoxGeometry(LEG_WIDTH * 0.6, LEG_WIDTH * 0.6, CONVEYOR_WIDTH);
    const brace = new THREE.Mesh(braceGeo, materials.steelDark);
    brace.position.set(xPos, CONVEYOR_HEIGHT * 0.35, 0);
    brace.castShadow = true;
    conveyorGroup.add(brace);
  }

  // =====================
  // ROLLERS (cylindrical, spanning between rails)
  // =====================
  const rollerGeo = new THREE.CylinderGeometry(ROLLER_RADIUS, ROLLER_RADIUS, CONVEYOR_WIDTH - 0.1, 16);
  // Rollers are rotated so the cylinder spans the width (Z axis)
  const rollerSpacing = CONVEYOR_LENGTH / (ROLLER_COUNT + 1);

  for (let i = 0; i < ROLLER_COUNT; i++) {
    const roller = new THREE.Mesh(rollerGeo, materials.rollerMat);
    const xPos = -halfLength + rollerSpacing * (i + 1);
    roller.position.set(xPos, CONVEYOR_HEIGHT + ROLLER_RADIUS * 0.3, 0);
    roller.rotation.x = Math.PI / 2; // align cylinder along Z
    roller.castShadow = true;
    roller.name = `Roller_${String(i + 1).padStart(2, '0')}`;
    conveyorGroup.add(roller);
    rollers.push(roller);
  }

  // =====================
  // DRIVE ROLLER (larger, at motor end)
  // =====================
  const endRollerRadius = ROLLER_RADIUS * 1.3;
  const endRollerX = halfLength - 0.3;
  // Align the top of end rollers with regular rollers
  const endRollerY = CONVEYOR_HEIGHT + ROLLER_RADIUS * 0.3 - (endRollerRadius - ROLLER_RADIUS);

  const driveRollerGeo = new THREE.CylinderGeometry(
    endRollerRadius, endRollerRadius, CONVEYOR_WIDTH - 0.05, 20
  );
  const driveRoller = new THREE.Mesh(driveRollerGeo, materials.rollerMat);
  driveRoller.position.set(-endRollerX, endRollerY, 0);
  driveRoller.rotation.x = Math.PI / 2;
  driveRoller.castShadow = true;
  driveRoller.name = 'Drive_Roller';
  conveyorGroup.add(driveRoller);
  rollers.push(driveRoller);

  // Tail roller (opposite end)
  const tailRoller = new THREE.Mesh(driveRollerGeo, materials.rollerMat);
  tailRoller.position.set(endRollerX, endRollerY, 0);
  tailRoller.rotation.x = Math.PI / 2;
  tailRoller.castShadow = true;
  tailRoller.name = 'Tail_Roller';
  conveyorGroup.add(tailRoller);
  rollers.push(tailRoller);

  // =====================
  // CONVEYOR BELT (continuous loop)
  // =====================
  const beltMesh = new THREE.Group();
  beltMesh.name = 'Belt';

  const beltWidth = CONVEYOR_WIDTH - 0.2;
  const beltLength = 2 * endRollerX;
  const topBeltY = endRollerY + endRollerRadius + BELT_THICKNESS / 2;
  const bottomBeltY = endRollerY - endRollerRadius - BELT_THICKNESS / 2;

  // Top belt (moves right when offset decreases)
  const beltGeo = new THREE.BoxGeometry(beltLength, BELT_THICKNESS, beltWidth);
  const topBelt = new THREE.Mesh(beltGeo, materials.belt);
  topBelt.position.set(0, topBeltY, 0);
  topBelt.castShadow = true;
  topBelt.receiveShadow = true;
  beltMesh.add(topBelt);

  // Bottom belt (rotated to move left when offset decreases)
  const bottomBelt = new THREE.Mesh(beltGeo, materials.belt);
  bottomBelt.position.set(0, bottomBeltY, 0);
  bottomBelt.rotation.z = Math.PI;
  bottomBelt.castShadow = true;
  bottomBelt.receiveShadow = true;
  beltMesh.add(bottomBelt);

  // End curves (half cylinders)
  const endCurveRadius = endRollerRadius + BELT_THICKNESS;
  const endCurveArc = Math.PI * endCurveRadius;
  const curveUVScaling = endCurveArc / beltLength;

  // Right curve (open ended)
  const rightCurveGeo = new THREE.CylinderGeometry(endCurveRadius, endCurveRadius, beltWidth, 32, 1, true, 0, Math.PI);
  const uvRight = rightCurveGeo.attributes.uv;
  for (let i = 0; i < uvRight.count; i++) {
    // Invert U so texture moves DOWN when offset decreases
    uvRight.setX(i, (1 - uvRight.getX(i)) * curveUVScaling);
  }
  const rightCurve = new THREE.Mesh(rightCurveGeo, materials.belt);
  rightCurve.position.set(endRollerX, endRollerY, 0);
  rightCurve.rotation.x = Math.PI / 2;
  rightCurve.castShadow = true;
  rightCurve.receiveShadow = true;
  beltMesh.add(rightCurve);

  // Left curve (open ended)
  const leftCurveGeo = new THREE.CylinderGeometry(endCurveRadius, endCurveRadius, beltWidth, 32, 1, true, Math.PI, Math.PI);
  const uvLeft = leftCurveGeo.attributes.uv;
  for (let i = 0; i < uvLeft.count; i++) {
    // Invert U so texture moves UP when offset decreases
    uvLeft.setX(i, (1 - uvLeft.getX(i)) * curveUVScaling);
  }
  const leftCurve = new THREE.Mesh(leftCurveGeo, materials.belt);
  leftCurve.position.set(-endRollerX, endRollerY, 0);
  leftCurve.rotation.x = Math.PI / 2;
  leftCurve.castShadow = true;
  leftCurve.receiveShadow = true;
  beltMesh.add(leftCurve);

  // Side caps for right curve
  const rightRingGeo = new THREE.RingGeometry(endRollerRadius, endCurveRadius, 32, 1, -Math.PI/2, Math.PI);
  const rightCap1 = new THREE.Mesh(rightRingGeo, materials.belt);
  rightCap1.position.set(endRollerX, endRollerY, beltWidth / 2);
  beltMesh.add(rightCap1);
  const rightCap2 = new THREE.Mesh(rightRingGeo, materials.belt);
  rightCap2.position.set(endRollerX, endRollerY, -beltWidth / 2);
  rightCap2.rotation.x = Math.PI; 
  beltMesh.add(rightCap2);

  // Side caps for left curve
  const leftRingGeo = new THREE.RingGeometry(endRollerRadius, endCurveRadius, 32, 1, Math.PI/2, Math.PI);
  const leftCap1 = new THREE.Mesh(leftRingGeo, materials.belt);
  leftCap1.position.set(-endRollerX, endRollerY, beltWidth / 2);
  beltMesh.add(leftCap1);
  const leftCap2 = new THREE.Mesh(leftRingGeo, materials.belt);
  leftCap2.position.set(-endRollerX, endRollerY, -beltWidth / 2);
  leftCap2.rotation.x = Math.PI;
  beltMesh.add(leftCap2);

  conveyorGroup.add(beltMesh);

  // =====================
  // END CAPS (flat plates at each end of the frame)
  // =====================
  const endCapGeo = new THREE.BoxGeometry(RAIL_THICKNESS, 0.6, CONVEYOR_WIDTH + 0.1);
  const endCapMat = materials.steelDark;

  const endCap1 = new THREE.Mesh(endCapGeo, endCapMat);
  endCap1.position.set(-halfLength, CONVEYOR_HEIGHT - 0.2, 0);
  endCap1.castShadow = true;
  conveyorGroup.add(endCap1);

  const endCap2 = new THREE.Mesh(endCapGeo, endCapMat);
  endCap2.position.set(halfLength, CONVEYOR_HEIGHT - 0.2, 0);
  endCap2.castShadow = true;
  conveyorGroup.add(endCap2);

  return {
    conveyorGroup,
    rollers,
    beltMesh,
    beltTexture: materials.beltTexture,
    materials,
  };
}

// Export dimensions for other modules to position joints/sensors
export const DIMENSIONS = {
  length: CONVEYOR_LENGTH,
  width: CONVEYOR_WIDTH,
  height: CONVEYOR_HEIGHT,
  rollerRadius: ROLLER_RADIUS,
  beltThickness: BELT_THICKNESS,
  beltY: CONVEYOR_HEIGHT + ROLLER_RADIUS * 0.3 + ROLLER_RADIUS + BELT_THICKNESS,
};
