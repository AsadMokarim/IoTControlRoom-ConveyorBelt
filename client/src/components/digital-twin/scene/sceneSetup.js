/**
 * sceneSetup.js
 * 
 * Creates the Three.js scene, camera, renderer, lighting, and ground plane.
 * Provides the foundational 3D environment for the digital twin.
 */

import * as THREE from 'three';

// Scene background color — dark industrial navy
const BG_COLOR = 0x0a0e17;

/**
 * Creates and configures the Three.js scene with industrial lighting.
 * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer }}
 */
export function createScene(canvasContainer) {
  // --- Scene ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG_COLOR);
  scene.fog = new THREE.Fog(BG_COLOR, 25, 60);

  // --- Camera ---
  const aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
  // 3/4 perspective — elevated, angled view of the conveyor
  camera.position.set(8, 6, 10);
  camera.lookAt(0, 1, 0);

  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });
  renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  canvasContainer.appendChild(renderer.domElement);

  // --- Lighting ---
  // Key directional light (casts shadows)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
  dirLight.position.set(8, 12, 6);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 40;
  dirLight.shadow.camera.left = -12;
  dirLight.shadow.camera.right = 12;
  dirLight.shadow.camera.top = 12;
  dirLight.shadow.camera.bottom = -12;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // Hemisphere ambient fill — subtle blue/gray industrial tones
  const hemiLight = new THREE.HemisphereLight(0x8899aa, 0x223344, 0.6);
  scene.add(hemiLight);

  // Subtle accent lights
  const accent1 = new THREE.PointLight(0x4488cc, 0.3, 30);
  accent1.position.set(-6, 5, -4);
  scene.add(accent1);

  const accent2 = new THREE.PointLight(0x6644aa, 0.2, 25);
  accent2.position.set(6, 3, -8);
  scene.add(accent2);

  // --- Ground Plane ---
  const groundGeo = new THREE.PlaneGeometry(60, 60);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0xf4f4f4,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  // Subtle grid overlay
  const gridHelper = new THREE.GridHelper(60, 60, 0xcccccc, 0xdddddd);
  gridHelper.position.y = 0.005;
  scene.add(gridHelper);

  // --- Resize handler ---
  function onResize() {
    const w = canvasContainer.clientWidth;
    const h = canvasContainer.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, onResize, ground, gridHelper };
}
