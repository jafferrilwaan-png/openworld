import * as THREE from "three/webgpu";

const MAX_FORWARD_SPEED = 42; // ~150 km/h
const MAX_REVERSE_SPEED = -16; // ~58 km/h
const ACCELERATION = 24; // m/s^2
const REVERSE_ACCEL = 18; // m/s^2
const BRAKE_DECEL = 40; // m/s^2
const NATURAL_DECEL = 10;
const MAX_STEER = 0.52; // ~30 degrees
const STEER_SPEED = 4.0;
const STEER_RETURN = 6.0;
const WHEEL_RADIUS = 0.38;
const ENTER_DISTANCE = 4.5; // Can only enter car if within 4.5m

export function createCarController({
  camera,
  car,
  collider,
  ground,
  colliders = [],
  walkControls,
  domElement = window,
  onModeChange,
}) {
  if (!car) {
    return {
      update: () => {},
      isDriving: () => false,
      toggleDrive: () => {},
      enterCar: () => {},
      exitCar: () => {},
      isNearCar: () => false,
      destroy: () => {},
    };
  }

  // Find wheels & body
  const frontLeftWheel = car.getObjectByName("front.001");
  const frontRightWheel = car.getObjectByName("front.002");
  const rearLeftWheel = car.getObjectByName("mesh_431");
  const rearRightWheel = car.getObjectByName("mesh_431.001");
  const bodyMesh = car.getObjectByName("SK_Body_Seba_Skeleton");

  let isDriving = false;
  let speed = 0;
  let steerAngle = 0;
  let yaw = car.rotation.y;
  let wheelRotation = 0;

  const carForward = new THREE.Vector3();
  const carRight = new THREE.Vector3();
  const carUp = new THREE.Vector3(0, 1, 0);

  const desiredCamPos = new THREE.Vector3();
  const desiredCamTarget = new THREE.Vector3();
  const currentCamTarget = new THREE.Vector3();

  const groundRaycaster = new THREE.Raycaster();
  groundRaycaster.firstHitOnly = true;
  const rayOrigin = new THREE.Vector3();
  const rayDir = new THREE.Vector3(0, -1, 0);

  const bumperRaycaster = new THREE.Raycaster();
  bumperRaycaster.firstHitOnly = true;
  const bumperOrigin = new THREE.Vector3();

  const inputs = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    drift: false,
  };

  function isEditable(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  function getDistanceToCar() {
    return camera.position.distanceTo(car.position);
  }

  function isNearCar() {
    return getDistanceToCar() <= ENTER_DISTANCE;
  }

  function onKeyDown(e) {
    if (isEditable(e.target)) return;

    // F key toggles enter/exit
    if (e.code === "KeyF") {
      e.preventDefault();
      if (isDriving) {
        exitCar();
      } else if (isNearCar()) {
        enterCar();
      }
      return;
    }

    // When NOT driving, DO NOT consume movement keys! Let walkControls handle WASD!
    if (!isDriving) return;

    if (e.code === "KeyW" || e.code === "ArrowUp") inputs.forward = true;
    if (e.code === "KeyS" || e.code === "ArrowDown") inputs.backward = true;
    if (e.code === "KeyA" || e.code === "ArrowLeft") inputs.left = true;
    if (e.code === "KeyD" || e.code === "ArrowRight") inputs.right = true;
    if (e.code === "Space") inputs.drift = true;
  }

  function onKeyUp(e) {
    if (!isDriving) return;

    if (e.code === "KeyW" || e.code === "ArrowUp") inputs.forward = false;
    if (e.code === "KeyS" || e.code === "ArrowDown") inputs.backward = false;
    if (e.code === "KeyA" || e.code === "ArrowLeft") inputs.left = false;
    if (e.code === "KeyD" || e.code === "ArrowRight") inputs.right = false;
    if (e.code === "Space") inputs.drift = false;
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  function enterCar() {
    isDriving = true;
    walkControls?.setActive(false);

    // Remove walk collider so car drives smoothly
    if (collider) {
      collider.position.set(0, -999, 0);
      collider.updateMatrixWorld(true);
    }

    currentCamTarget.copy(car.position).add(new THREE.Vector3(0, 1.2, 0));
    onModeChange?.("drive");
  }

  function exitCar() {
    isDriving = false;
    speed = 0;
    steerAngle = 0;
    inputs.forward = false;
    inputs.backward = false;
    inputs.left = false;
    inputs.right = false;
    inputs.drift = false;

    // Place player beside car on driver's side (left)
    car.getWorldDirection(carForward);
    carRight.crossVectors(carUp, carForward).normalize();

    // Place player 2.2m to left of car
    const exitPos = car.position.clone().addScaledVector(carRight, -2.2);
    camera.position.set(exitPos.x, car.position.y + 1.6, exitPos.z);

    if (collider) {
      collider.position.copy(car.position);
      collider.updateMatrixWorld(true);
    }

    // Enable walk controls cleanly
    walkControls?.setActive(true);
    walkControls?.syncEulerFromCamera();
    walkControls?.snapCameraToGround?.();

    onModeChange?.("walk");
  }

  function toggleDrive() {
    if (isDriving) {
      exitCar();
    } else if (isNearCar()) {
      enterCar();
    }
  }

  function update(delta) {
    const dt = Math.min(delta, 0.05);

    if (isDriving) {
      updateDrivingPhysics(dt);
      updateDrivingCamera(dt);
    }

    updateWheelVisuals(dt);
  }

  function updateDrivingPhysics(dt) {
    // Steering
    let targetSteer = 0;
    if (inputs.left) targetSteer += MAX_STEER;
    if (inputs.right) targetSteer -= MAX_STEER;

    // Dynamic steering response based on speed
    const speedFactor = Math.max(0.35, 1 - (Math.abs(speed) / MAX_FORWARD_SPEED) * 0.5);
    targetSteer *= speedFactor;

    if (targetSteer !== 0) {
      steerAngle += (targetSteer - steerAngle) * Math.min(1, STEER_SPEED * dt);
    } else {
      steerAngle += (0 - steerAngle) * Math.min(1, STEER_RETURN * dt);
    }

    // Acceleration & Reverse (INSTANT AND RELIABLE REVERSE)
    if (inputs.forward) {
      if (speed < -0.2) {
        // Braking while going reverse
        speed += BRAKE_DECEL * dt;
        if (speed > 0) speed = 0;
      } else {
        // Accelerate forward
        const power = 1 - (Math.max(0, speed) / MAX_FORWARD_SPEED) * 0.65;
        speed += ACCELERATION * power * dt;
        speed = Math.min(speed, MAX_FORWARD_SPEED);
      }
    } else if (inputs.backward) {
      if (speed > 0.5) {
        // Braking while going forward
        speed -= BRAKE_DECEL * dt;
        if (speed < 0) speed = 0;
      } else {
        // Smoothly accelerate backward (REVERSE GEAR)
        const revPower = 1 - (Math.abs(speed) / Math.abs(MAX_REVERSE_SPEED)) * 0.4;
        speed -= REVERSE_ACCEL * revPower * dt;
        speed = Math.max(speed, MAX_REVERSE_SPEED);
      }
    } else {
      // Natural rolling resistance and air friction
      if (speed > 0) {
        speed = Math.max(0, speed - NATURAL_DECEL * dt);
      } else if (speed < 0) {
        speed = Math.min(0, speed + NATURAL_DECEL * dt);
      }
    }

    // Handbrake drift
    if (inputs.drift && Math.abs(speed) > 2) {
      speed *= (1 - 0.35 * dt);
      steerAngle *= 1.2;
    }

    // Yaw rotation from steering
    if (Math.abs(speed) > 0.1) {
      const turnRate = (steerAngle * (speed / 3.2)) * dt;
      yaw += turnRate;
      car.rotation.y = yaw;
    }

    // Forward direction vector
    carForward.set(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const moveDist = speed * dt;

    // Check collisions from front/rear bumper
    let blocked = false;
    if (colliders && colliders.length > 0 && Math.abs(moveDist) > 0.005) {
      const isFwd = moveDist > 0;
      // Probe from bumper (front: +2.1m, rear: -2.1m)
      bumperOrigin.copy(car.position).addScaledVector(carForward, isFwd ? 2.1 : -2.1);
      bumperOrigin.y += 0.5;

      bumperRaycaster.set(bumperOrigin, isFwd ? carForward : carForward.clone().negate());
      bumperRaycaster.far = Math.abs(moveDist) + 0.35;

      for (const col of colliders) {
        const hits = bumperRaycaster.intersectObject(col, true);
        if (hits.length > 0) {
          blocked = true;
          break;
        }
      }
    }

    if (blocked) {
      speed = 0; // Stop cleanly against obstacles
    } else {
      car.position.addScaledVector(carForward, moveDist);
    }

    // Ground raycast snapping
    if (ground) {
      rayOrigin.set(car.position.x, car.position.y + 5, car.position.z);
      groundRaycaster.set(rayOrigin, rayDir);
      groundRaycaster.far = 15;
      const hits = groundRaycaster.intersectObject(ground, true);
      if (hits.length > 0) {
        car.position.y = hits[0].point.y + 0.03;
      }
    }

    car.updateMatrixWorld(true);
  }

  function updateWheelVisuals(dt) {
    wheelRotation += (speed / WHEEL_RADIUS) * dt;

    if (frontLeftWheel) {
      frontLeftWheel.rotation.y = steerAngle;
      frontLeftWheel.rotation.x = wheelRotation;
    }
    if (frontRightWheel) {
      frontRightWheel.rotation.y = steerAngle;
      frontRightWheel.rotation.x = wheelRotation;
    }
    if (rearLeftWheel) {
      rearLeftWheel.rotation.x = wheelRotation;
    }
    if (rearRightWheel) {
      rearRightWheel.rotation.x = wheelRotation;
    }

    if (bodyMesh) {
      const lateralTilt = -steerAngle * (speed / 30) * 0.08;
      const pitchTilt = inputs.forward ? -0.02 : inputs.backward ? 0.03 : 0;
      bodyMesh.rotation.z = THREE.MathUtils.lerp(bodyMesh.rotation.z, lateralTilt, dt * 10);
      bodyMesh.rotation.x = THREE.MathUtils.lerp(bodyMesh.rotation.x, pitchTilt, dt * 10);
    }
  }

  function updateDrivingCamera(dt) {
    car.getWorldDirection(carForward);

    // Look slightly ahead of car
    desiredCamTarget.copy(car.position).add(new THREE.Vector3(0, 1.3, 0)).addScaledVector(carForward, 3.5);
    currentCamTarget.lerp(desiredCamTarget, Math.min(1, dt * 8));

    // Smooth chase position behind car
    const camDist = 6.0 + (Math.abs(speed) / MAX_FORWARD_SPEED) * 1.5;
    const camHeight = 2.3;

    desiredCamPos
      .copy(car.position)
      .subScaledVector(carForward, camDist)
      .add(new THREE.Vector3(0, camHeight, 0));

    camera.position.lerp(desiredCamPos, Math.min(1, dt * 7));
    camera.lookAt(currentCamTarget);
  }

  function getSpeedKmh() {
    return Math.round(Math.abs(speed) * 3.6);
  }

  function getGear() {
    if (speed < -0.3) return "R";
    if (speed > 0.3) return "D";
    return "N";
  }

  function destroy() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  }

  return {
    update,
    isDriving: () => isDriving,
    isNearCar,
    toggleDrive,
    enterCar,
    exitCar,
    getSpeedKmh,
    getGear,
    destroy,
  };
}
