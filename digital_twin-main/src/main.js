/**
 * main.js
 * 
 * Central orchestrator for the Digital Twin application.
 * 
 * Wires together:
 *  - Three.js scene, camera, controls
 *  - Procedural conveyor model (frame, belt, rollers, motor)
 *  - Joints and sensors (interactive, raycastable)
 *  - Simulated data provider (MQTT-ready abstraction)
 *  - Failure simulation (degradation → emergency stop)
 *  - Dashboard UI, charts, alerts, twin status
 * 
 * Data flow:
 *  DataProvider → Normalized sensor state → Digital Twin state
 *  → 3D visualization + Dashboard + Safety decision
 */

import * as THREE from 'three';
import { createScene } from './scene/sceneSetup.js';
import { setupCameraControls } from './scene/camera.js';
import { createConveyor } from './scene/conveyor.js';
import { createMotor } from './scene/motor.js';
import { createJoints, getJointRaycastTargets, JOINT_STATE } from './scene/joints.js';
import { createSensors, getSensorRaycastTargets } from './scene/sensors.js';
import { SimulatedDataProvider } from './data/dataProvider.js';
import { FailureSimulation } from './simulation/failureSimulation.js';
import { initDashboard, updateDashboard, selectJoint, getSelectedJointId, onDashboardJointClick } from './ui/dashboard.js';
import { initAlerts, showCriticalAlert, hideCriticalAlert } from './ui/alerts.js';
import { initCharts, updateCharts } from './ui/charts.js';
import { initTwinStatus, updateTwinStatus } from './ui/twinStatus.js';

// ============================================================
// State
// ============================================================

let scene, camera, renderer, controls, resetCamera;
let conveyorGroup, rollers, beltMesh, beltTexture;
let motorGroup, motorState;
let joints, jointsGroup;
let sensorObjects, sensorsGroup;
let dataProvider, failureSim;
let clock;

// Raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let jointRaycastTargets = [];
let sensorRaycastTargets = [];

// Chart update throttle
let lastChartUpdate = 0;
const CHART_UPDATE_INTERVAL = 500; // ms

// ============================================================
// Initialization
// ============================================================

function init() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('embed') === '3d') {
    document.body.classList.add('embed-3d-only');
  }

  const canvasContainer = document.getElementById('canvas-container');

  // --- Three.js scene ---
  const sceneResult = createScene(canvasContainer);
  scene = sceneResult.scene;
  camera = sceneResult.camera;
  renderer = sceneResult.renderer;
  let ground = sceneResult.ground;
  let gridHelper = sceneResult.gridHelper;

  // --- Camera controls ---
  const camResult = setupCameraControls(camera, renderer.domElement);
  controls = camResult.controls;
  resetCamera = camResult.resetCamera;

  // --- Conveyor model ---
  const conveyorResult = createConveyor();
  conveyorGroup = conveyorResult.conveyorGroup;
  rollers = conveyorResult.rollers;
  beltMesh = conveyorResult.beltMesh;
  beltTexture = conveyorResult.beltTexture;
  scene.add(conveyorGroup);

  // --- Motor ---
  const motorResult = createMotor();
  motorGroup = motorResult.motorGroup;
  motorState = motorResult.motorState;
  scene.add(motorGroup);

  // --- Joints ---
  const jointsResult = createJoints();
  jointsGroup = jointsResult.jointsGroup;
  joints = jointsResult.joints;
  scene.add(jointsGroup);
  jointRaycastTargets = getJointRaycastTargets(joints);

  // --- Sensors ---
  const sensorsResult = createSensors();
  sensorsGroup = sensorsResult.sensorsGroup;
  sensorObjects = sensorsResult.sensorObjects;
  scene.add(sensorsGroup);
  sensorRaycastTargets = getSensorRaycastTargets(sensorObjects);

  // --- Data Provider (simulated, MQTT-ready architecture) ---
  dataProvider = new SimulatedDataProvider();
  dataProvider.start(500);

  // --- Failure Simulation ---
  failureSim = new FailureSimulation(dataProvider);
  failureSim.onStageChange((stage, data) => {
    if (stage === 'emergency') {
      motorState.running = false;
      showCriticalAlert(data);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'DIGITAL_TWIN_ALERT', payload: data }, '*');
      }
    }
    if (stage === 'reset') {
      motorState.running = true;
      hideCriticalAlert();
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'DIGITAL_TWIN_RESET', payload: {} }, '*');
      }
      // Reset joint visuals
      for (const j of joints) {
        j.setState(JOINT_STATE.NORMAL);
        j.riskPercent = 5 + Math.floor(Math.random() * 8);
      }
    }
  });

  // --- UI Initialization ---
  initDashboard();
  initAlerts();
  initCharts();
  initTwinStatus();

  // --- Data updates → UI + 3D sync ---
  dataProvider.onData(({ sensorData, jointStates, systemState }) => {
    // Sync joint 3D visuals with data provider state
    for (const jState of jointStates) {
      const jointObj = joints.find(j => j.id === jState.id);
      if (jointObj) {
        jointObj.setState(jState.state);
        jointObj.riskPercent = jState.riskPercent;
      }
    }

    // Sync motor state
    motorState.running = systemState.motorRunning;

    // Update sensor objects with current readings
    const sensorMap = {
      vibration: sensorData.vibration,
      temperature: sensorData.temperature,
      motorCurrent: sensorData.motorCurrent,
      camera: 0,
    };
    for (const s of sensorObjects) {
      if (sensorMap[s.id] !== undefined) {
        s.currentReading = sensorMap[s.id];
      }
    }

    // Update dashboard
    updateDashboard(sensorData, jointStates, systemState);
    updateTwinStatus(systemState);

    // Throttled chart updates
    const now = Date.now();
    if (now - lastChartUpdate > CHART_UPDATE_INTERVAL) {
      updateCharts(sensorData);
      lastChartUpdate = now;
    }
  });

  // --- Interaction (clicks) ---
  renderer.domElement.addEventListener('click', onCanvasClick);

  // Dashboard joint clicks → 3D highlight
  onDashboardJointClick(handleJointSelection);

  // --- PostMessage API for External Dashboard Iframe Integration ---
  dataProvider.onData(({ sensorData, jointStates, systemState }) => {
    // Send telemetry to parent window if embedded in iframe
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'DIGITAL_TWIN_TELEMETRY',
        payload: { sensorData, jointStates, systemState }
      }, '*');
    }
  });

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'START_SIMULATION') {
      if (!failureSim.isRunning) failureSim.start();
    } else if (event.data?.type === 'RESET_SIMULATION') {
      failureSim.reset();
    } else if (event.data?.type === 'RESET_CAMERA') {
      resetCamera();
    }
  });

  // --- Button wiring ---
  document.getElementById('btn-simulate')?.addEventListener('click', () => {
    if (!failureSim.isRunning) {
      failureSim.start();
    }
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    failureSim.reset();
  });

  document.getElementById('btn-reset-camera')?.addEventListener('click', () => {
    resetCamera();
  });

  let isWhiteBg = true;
  document.getElementById('btn-bg-toggle')?.addEventListener('click', () => {
    isWhiteBg = !isWhiteBg;
    const newColor = isWhiteBg ? 0xffffff : 0x000000;
    scene.background.setHex(newColor);
    if (scene.fog) {
      scene.fog.color.setHex(newColor);
    }
    
    // Update ground
    if (ground && ground.material) {
      ground.material.color.setHex(isWhiteBg ? 0xf4f4f4 : 0x0d1117);
    }
    
    // Update grid helper by replacing it
    if (gridHelper) {
      scene.remove(gridHelper);
      gridHelper.geometry.dispose();
      gridHelper.material.dispose();
    }
    gridHelper = new THREE.GridHelper(
      60, 60, 
      isWhiteBg ? 0xcccccc : 0x1a2332, 
      isWhiteBg ? 0xdddddd : 0x141c28
    );
    gridHelper.position.y = 0.005;
    scene.add(gridHelper);
  });

  // --- Clock ---
  clock = new THREE.Clock();

  // --- Hide loading screen ---
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => loadingScreen.remove(), 600);
    }
  }, 800);

  // --- Start render loop ---
  animate();
}

// ============================================================
// Animation Loop
// ============================================================

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Camera controls
  controls.update();

  // Failure simulation update
  failureSim.update(delta);

  // --- Belt animation (texture scroll) ---
  if (motorState.running && beltTexture) {
    beltTexture.offset.x -= delta * 1.0;
    
    // Move the joints along with the belt
    // The belt top is 9.4 units long, and texture repeats 8 times (9.4 / 8 = 1.175 units/sec)
    const beltSpeed = 1.175;
    for (const j of joints) {
      j.group.position.x += beltSpeed * delta;
      
      // Loop around at the ends (endRollerX is 4.7)
      if (j.group.position.x > 4.7) {
        j.group.position.x -= 9.4;
      }
    }
  }

  // --- Roller rotation ---
  if (motorState.running) {
    for (const roller of rollers) {
      roller.rotation.y += delta * 2.0;
    }
  }

  // --- Joint pulse animation (critical state) ---
  for (const j of joints) {
    j.updatePulse(delta);
  }

  // --- Render ---
  renderer.render(scene, camera);
}

// ============================================================
// Raycasting / Interaction
// ============================================================

function onCanvasClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Check joints first
  const jointHits = raycaster.intersectObjects(jointRaycastTargets, false);
  if (jointHits.length > 0) {
    const hit = jointHits[0].object;
    const jointId = hit.userData.jointId;
    if (jointId) {
      handleJointSelection(jointId);
      return;
    }
  }

  // Check sensors
  const sensorHits = raycaster.intersectObjects(sensorRaycastTargets, false);
  if (sensorHits.length > 0) {
    const hit = sensorHits[0].object;
    const sensorId = hit.userData.sensorId;
    if (sensorId) {
      handleSensorClick(sensorId);
      return;
    }
  }

  // Empty click — deselect
  handleJointSelection(null);
  hideSensorTooltip();
}

function handleJointSelection(jointId) {
  // Unhighlight all joints
  for (const j of joints) {
    j.unhighlight();
  }

  // Highlight selected
  if (jointId) {
    const joint = joints.find(j => j.id === jointId);
    if (joint) {
      joint.highlight();
    }
  }

  // Update dashboard
  selectJoint(jointId);
  hideSensorTooltip();
}

function handleSensorClick(sensorId) {
  const sensor = sensorObjects.find(s => s.id === sensorId);
  if (!sensor) return;

  const tooltip = document.getElementById('sensor-tooltip');
  const title = document.getElementById('sensor-tooltip-title');
  const model = document.getElementById('sensor-tooltip-model');
  const desc = document.getElementById('sensor-tooltip-desc');
  const reading = document.getElementById('sensor-tooltip-reading');

  if (tooltip && title && model && desc && reading) {
    title.textContent = sensor.name;
    model.textContent = sensor.model;
    desc.textContent = sensor.description;
    reading.textContent = sensor.unit
      ? `${sensor.currentReading.toFixed(2)} ${sensor.unit}`
      : 'Active';
    tooltip.classList.remove('hidden');
  }
}

function hideSensorTooltip() {
  const tooltip = document.getElementById('sensor-tooltip');
  if (tooltip) {
    tooltip.classList.add('hidden');
  }
}

// ============================================================
// Start
// ============================================================

init();
