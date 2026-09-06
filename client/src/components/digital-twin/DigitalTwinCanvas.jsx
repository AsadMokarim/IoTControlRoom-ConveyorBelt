import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { createScene } from './scene/sceneSetup.js';
import { setupCameraControls } from './scene/camera.js';
import { createConveyor } from './scene/conveyor.js';
import { createMotor } from './scene/motor.js';
import { createJoints, getJointRaycastTargets } from './scene/joints.js';
import { createSensors, getSensorRaycastTargets } from './scene/sensors.js';

const DigitalTwinCanvas = forwardRef(({
  telemetryData,
  onJointSelect,
  onSensorSelect,
  simulateFailure,
  resetSimulation
}, ref) => {
  const containerRef = useRef(null);
  const sceneRefs = useRef({});

  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      if (sceneRefs.current.resetCamera) {
        sceneRefs.current.resetCamera();
      }
    },
    toggleBackground: () => {
      const state = sceneRefs.current;
      if (!state || !state.scene) return;
      state.isWhiteBg = !state.isWhiteBg;
      const newColor = state.isWhiteBg ? 0xffffff : 0x000000;
      state.scene.background.setHex(newColor);
      if (state.scene.fog) {
        state.scene.fog.color.setHex(newColor);
      }
      if (state.ground && state.ground.material) {
        state.ground.material.color.setHex(state.isWhiteBg ? 0xf4f4f4 : 0x0d1117);
      }
      if (state.gridHelper) {
        state.scene.remove(state.gridHelper);
        state.gridHelper.geometry.dispose();
        state.gridHelper.material.dispose();
      }
      state.gridHelper = new THREE.GridHelper(
        60, 60, 
        state.isWhiteBg ? 0xcccccc : 0x1a2332, 
        state.isWhiteBg ? 0xdddddd : 0x141c28
      );
      state.gridHelper.position.y = 0.005;
      state.scene.add(state.gridHelper);
    }
  }));

  const callbacksRef = useRef({ onJointSelect, onSensorSelect });
  useEffect(() => {
    callbacksRef.current = { onJointSelect, onSensorSelect };
  }, [onJointSelect, onSensorSelect]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Force the container to have proper dimensions before init
    const container = containerRef.current;

    // Initialization
    const sceneResult = createScene(container);
    const scene = sceneResult.scene;
    const camera = sceneResult.camera;
    const renderer = sceneResult.renderer;
    
    const camResult = setupCameraControls(camera, renderer.domElement);
    const controls = camResult.controls;

    // ResizeObserver to handle dynamic panel resizing
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);
    
    const conveyorResult = createConveyor();
    scene.add(conveyorResult.conveyorGroup);
    
    const motorResult = createMotor();
    scene.add(motorResult.motorGroup);
    
    const jointsResult = createJoints();
    scene.add(jointsResult.jointsGroup);
    const jointRaycastTargets = getJointRaycastTargets(jointsResult.joints);
    
    const sensorsResult = createSensors();
    scene.add(sensorsResult.sensorsGroup);
    const sensorRaycastTargets = getSensorRaycastTargets(sensorsResult.sensorObjects);

    const clock = new THREE.Clock();
    let animationFrameId;

    sceneRefs.current = {
      scene,
      camera,
      renderer,
      controls,
      resetCamera: camResult.resetCamera,
      conveyorResult,
      motorResult,
      jointsResult,
      sensorsResult,
      jointRaycastTargets,
      sensorRaycastTargets,
      clock,
      isWhiteBg: false, // Default from sceneSetup
      ground: sceneResult.ground,
      gridHelper: sceneResult.gridHelper
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onCanvasClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Check joints
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
          if (callbacksRef.current.onSensorSelect) callbacksRef.current.onSensorSelect(sensorId);
          return;
        }
      }

      handleJointSelection(null);
      if (callbacksRef.current.onSensorSelect) callbacksRef.current.onSensorSelect(null);
    };

    const handleJointSelection = (jointId) => {
      const { joints } = jointsResult;
      for (const j of joints) {
        j.unhighlight();
      }
      if (jointId) {
        const joint = joints.find(j => j.id === jointId);
        if (joint) joint.highlight();
      }
      if (callbacksRef.current.onJointSelect) callbacksRef.current.onJointSelect(jointId);
    };

    renderer.domElement.addEventListener('click', onCanvasClick);

    // Roller spin axis: rollers lie along world-Z (their long axis after rotation.x = PI/2).
    // Spinning around world-Z makes each roller rotate like a real axle.
    // Cache the axis vector once — never allocate inside the animation loop.
    const ROLLER_SPIN_AXIS = new THREE.Vector3(0, 0, 1);
    // Physical angular speed: ω = belt_surface_speed / roller_radius
    // beltSpeed = 1.175 world-units/s, ROLLER_RADIUS = 0.15 → ω ≈ 7.83 rad/s
    // Negative sign: top of roller moves in +X direction (same as belt surface)
    const ROLLER_OMEGA = -(1.175 / 0.15);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      controls.update();

      const motorState = motorResult.motorState;
      const { joints } = jointsResult;
      const { beltTexture, rollers } = conveyorResult;

      if (motorState.running && beltTexture) {
        beltTexture.offset.x -= delta * 1.0;
        const beltSpeed = 1.175;
        for (const j of joints) {
          j.group.position.x += beltSpeed * delta;
          if (j.group.position.x > 4.7) {
            j.group.position.x -= 9.4;
          }
        }
      }

      if (motorState.running) {
        for (const roller of rollers) {
          roller.rotateOnWorldAxis(ROLLER_SPIN_AXIS, ROLLER_OMEGA * delta);
        }
      }

      for (const j of joints) {
        j.updatePulse(delta);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', sceneResult.onResize);
      renderer.domElement.removeEventListener('click', onCanvasClick);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync telemetry data to 3D scene
  useEffect(() => {
    if (!telemetryData || !sceneRefs.current) return;
    const { motorResult, jointsResult, sensorsResult } = sceneRefs.current;
    
    const simStage = typeof simulateFailure === 'number' ? simulateFailure : (simulateFailure ? 3 : 0);
    const isCritical = telemetryData.system_status === 'critical';

    if (motorResult) {
      motorResult.motorState.running = simStage !== 3 && !isCritical;
    }

    if (jointsResult) {
      const telemetryJoints = telemetryData.joints;
      jointsResult.joints.forEach((j, i) => {
        const jointData = telemetryJoints ? telemetryJoints.find(tj => tj.id === j.id) : null;
        let state = jointData ? jointData.state : (i === 1 ? 'WARNING' : i === 3 ? 'CRITICAL' : 'NORMAL');
        let riskPercent = jointData ? jointData.riskPercent : (state === 'CRITICAL' ? 92 : state === 'WARNING' ? 58 : 10);
        
        if (j.id === 'joint_3') {
          if (simStage === 1) {
            state = 'WARNING';
            riskPercent = 38;
          } else if (simStage === 2) {
            state = 'CRITICAL';
            riskPercent = 76;
          } else if (simStage === 3) {
            state = 'CRITICAL';
            riskPercent = 96;
          }
        }
        
        j.setState(state);
        j.riskPercent = riskPercent;
        if (jointData) {
          j.temperature = jointData.temperature;
          j.vibration = jointData.vibration;
          j.gapWidth = jointData.gapWidth;
          j.wearLevel = jointData.wearLevel;
          j.tension = jointData.tension;
        }
      });
    }

    if (sensorsResult && telemetryData.vibration && telemetryData.kpis) {
      const sensorMap = {
        vibration: telemetryData.vibration.rms,
        temperature: telemetryData.kpis.average_temperature,
        motorCurrent: 1.32,
        camera: 0,
      };
      for (const s of sensorsResult.sensorObjects) {
        if (sensorMap[s.id] !== undefined) {
          s.currentReading = sensorMap[s.id];
        }
      }
    }
  }, [telemetryData, simulateFailure]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
      className="digital-twin-canvas-container"
    />
  );
});

export default DigitalTwinCanvas;
