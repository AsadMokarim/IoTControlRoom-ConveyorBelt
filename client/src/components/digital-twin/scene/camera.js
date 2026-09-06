/**
 * camera.js
 * 
 * OrbitControls setup, camera constraints, and reset functionality.
 */

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Default camera position for the 3/4 industrial view
const DEFAULT_POSITION = { x: 8, y: 6, z: 10 };
const DEFAULT_TARGET = { x: 0, y: 1, z: 0 };

/**
 * Sets up OrbitControls with industrial-appropriate constraints.
 * @param {THREE.PerspectiveCamera} camera
 * @param {HTMLElement} domElement
 * @returns {{ controls: OrbitControls, resetCamera: Function }}
 */
export function setupCameraControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);

  // Smooth damping
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  // Zoom constraints
  controls.minDistance = 4;
  controls.maxDistance = 25;

  // Prevent going below ground
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minPolarAngle = 0.2;

  // Target the center of the conveyor
  controls.target.set(DEFAULT_TARGET.x, DEFAULT_TARGET.y, DEFAULT_TARGET.z);

  // Disable right-click context menu on canvas
  domElement.addEventListener('contextmenu', (e) => e.preventDefault());

  /**
   * Smoothly resets camera to the default 3/4 perspective view.
   */
  function resetCamera() {
    camera.position.set(DEFAULT_POSITION.x, DEFAULT_POSITION.y, DEFAULT_POSITION.z);
    controls.target.set(DEFAULT_TARGET.x, DEFAULT_TARGET.y, DEFAULT_TARGET.z);
    controls.update();
  }

  controls.update();

  return { controls, resetCamera };
}
