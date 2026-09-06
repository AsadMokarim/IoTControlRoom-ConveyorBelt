/**
 * joints.js
 * 
 * Four independently controllable belt joints (splice points).
 * Each joint has its own state (NORMAL / WARNING / CRITICAL) and risk percentage.
 * 
 * The 3D representation includes:
 *  - A ring on the belt surface (the joint itself)
 *  - A floating status indicator sphere above the joint
 * 
 * Joint states drive both the 3D visualization and the dashboard.
 */

import * as THREE from 'three';
import { DIMENSIONS } from './conveyor.js';

// Joint health states
export const JOINT_STATE = {
  NORMAL: 'NORMAL',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
};

// Colors for each state
const STATE_COLORS = {
  [JOINT_STATE.NORMAL]: 0x22c55e,   // green
  [JOINT_STATE.WARNING]: 0xf59e0b,  // amber
  [JOINT_STATE.CRITICAL]: 0xef4444, // red
};

// Joint positions along the conveyor belt (X positions)
const JOINT_POSITIONS = [
  -3.0,  // Joint 1
  -1.0,  // Joint 2
   1.0,  // Joint 3
   3.0,  // Joint 4
];

/**
 * Creates the four belt joint objects.
 * @returns {{ jointsGroup: THREE.Group, joints: JointObject[] }}
 */
export function createJoints() {
  const jointsGroup = new THREE.Group();
  jointsGroup.name = 'Joints';

  const joints = [];

  for (let i = 0; i < 4; i++) {
    const joint = createSingleJoint(i + 1, JOINT_POSITIONS[i]);
    jointsGroup.add(joint.group);
    joints.push(joint);
  }

  return { jointsGroup, joints };
}

/**
 * Creates a single joint object.
 */
function createSingleJoint(index, xPos) {
  const group = new THREE.Group();
  group.name = `Joint_${String(index).padStart(2, '0')}`;
  group.position.set(xPos, 0, 0);

  const id = `joint_${index}`;
  const beltY = DIMENSIONS.beltY;

  // --- Joint ring on the belt surface ---
  const ringGeo = new THREE.TorusGeometry(0.25, 0.03, 8, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: STATE_COLORS[JOINT_STATE.NORMAL],
    emissive: STATE_COLORS[JOINT_STATE.NORMAL],
    emissiveIntensity: 0.3,
    roughness: 0.4,
    metalness: 0.6,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, beltY + 0.02, 0);
  ring.castShadow = true;
  // Tag for raycasting identification
  ring.userData = { type: 'joint', jointId: id, jointIndex: index };
  group.add(ring);

  // --- Floating status indicator sphere ---
  const indicatorGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const indicatorMat = new THREE.MeshStandardMaterial({
    color: STATE_COLORS[JOINT_STATE.NORMAL],
    emissive: STATE_COLORS[JOINT_STATE.NORMAL],
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.3,
  });
  const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
  indicator.position.set(0, beltY + 0.7, 0);
  indicator.userData = { type: 'joint', jointId: id, jointIndex: index };
  group.add(indicator);

  // --- Thin vertical line connecting indicator to ring ---
  const lineGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.55, 4);
  const lineMat = new THREE.MeshBasicMaterial({
    color: STATE_COLORS[JOINT_STATE.NORMAL],
    transparent: true,
    opacity: 0.4,
  });
  const line = new THREE.Mesh(lineGeo, lineMat);
  line.position.set(0, beltY + 0.38, 0);
  group.add(line);

  // --- Joint data object ---
  const jointObj = {
    id,
    index,
    name: `Joint ${index}`,
    group,
    ring,
    indicator,
    line,
    ringMat,
    indicatorMat,
    lineMat,
    state: JOINT_STATE.NORMAL,
    riskPercent: 5 + Math.floor(Math.random() * 8), // 5-12% baseline
    selected: false,
    _pulsePhase: 0,

    /**
     * Updates the joint's health state and visual appearance.
     */
    setState(newState) {
      this.state = newState;
      const color = STATE_COLORS[newState];

      this.ringMat.color.setHex(color);
      this.ringMat.emissive.setHex(color);
      this.indicatorMat.color.setHex(color);
      this.indicatorMat.emissive.setHex(color);
      this.lineMat.color.setHex(color);
    },

    /**
     * Highlights this joint as selected.
     */
    highlight() {
      this.selected = true;
      this.ringMat.emissiveIntensity = 0.8;
      this.indicatorMat.emissiveIntensity = 1.0;
      this.lineMat.opacity = 0.8;
      this.indicator.scale.set(1.4, 1.4, 1.4);
    },

    /**
     * Removes the selection highlight.
     */
    unhighlight() {
      this.selected = false;
      this.ringMat.emissiveIntensity = 0.3;
      this.indicatorMat.emissiveIntensity = 0.5;
      this.lineMat.opacity = 0.4;
      this.indicator.scale.set(1, 1, 1);
    },

    /**
     * Updates the pulse animation for CRITICAL joints.
     * Should be called each frame with deltaTime.
     */
    updatePulse(deltaTime) {
      if (this.state === JOINT_STATE.CRITICAL) {
        this._pulsePhase += deltaTime * 3;
        const pulse = 0.5 + Math.sin(this._pulsePhase) * 0.4;
        this.ringMat.emissiveIntensity = this.selected ? 0.8 + pulse * 0.2 : pulse;
        this.indicatorMat.emissiveIntensity = this.selected ? 1.0 : 0.5 + pulse * 0.5;
        const s = 1.0 + Math.sin(this._pulsePhase) * 0.1;
        if (!this.selected) {
          this.indicator.scale.set(s, s, s);
        }
      }
    },
  };

  return jointObj;
}

/**
 * Returns all raycastable meshes from the joints (rings + indicators).
 */
export function getJointRaycastTargets(joints) {
  const targets = [];
  for (const j of joints) {
    targets.push(j.ring, j.indicator);
  }
  return targets;
}
