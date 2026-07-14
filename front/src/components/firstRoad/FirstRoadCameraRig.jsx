import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

import { useFirstRoadScroll } from "./FirstRoadScrollContext.jsx";

const DESKTOP_KEYFRAMES = [
  {
    at: 0,
    position: [-2.6, 4.8, -19],
    target: [0, 1.75, -54],
    fov: 44,
    roll: -0.003,
  },
  {
    at: 0.12,
    position: [-1.5, 4.45, -23.5],
    target: [0, 1.85, -58],
    fov: 42,
    roll: -0.002,
  },
  {
    at: 0.2,
    position: [-0.45, 3.95, -30.5],
    target: [0, 2.22, -68],
    fov: 44,
    roll: -0.001,
  },
  {
    at: 0.28,
    position: [-1.7, 3.42, -36.1],
    target: [0, 2.8, -98],
    fov: 49,
    roll: -0.001,
  },
  {
    at: 0.34,
    position: [0, 3.18, -38.2],
    target: [0, 3.02, -138],
    fov: 53,
    roll: 0,
  },
  {
    at: 0.44,
    position: [0.08, 3.28, -38.25],
    target: [0, 3.04, -156],
    fov: 50,
    roll: 0,
  },
  {
    at: 0.52,
    position: [0.55, 3.7, -33],
    target: [0, 2.25, -80],
    fov: 46,
    roll: 0.001,
  },
  {
    at: 0.62,
    position: [1.15, 4.7, -27.5],
    target: [0, 1.75, -64],
    fov: 41,
    roll: 0.002,
  },
  {
    at: 0.72,
    position: [0.85, 5.55, -24],
    target: [0, 1.55, -72],
    fov: 39,
    roll: 0.001,
  },
  {
    at: 0.82,
    position: [0.45, 6.8, -19.5],
    target: [0, 1.35, -84],
    fov: 40,
    roll: 0.001,
  },
  {
    at: 1,
    position: [0, 8.2, -11],
    target: [0, 1.2, -108],
    fov: 42,
    roll: 0,
  },
];

const MOBILE_KEYFRAMES = [
  {
    at: 0,
    position: [-1.7, 4.2, -20],
    target: [0, 1.78, -52],
    fov: 55,
    roll: -0.002,
  },
  {
    at: 0.12,
    position: [-1, 4, -24],
    target: [0, 1.9, -56],
    fov: 53,
    roll: -0.001,
  },
  {
    at: 0.2,
    position: [-0.35, 3.7, -30.5],
    target: [0, 2.25, -66],
    fov: 54,
    roll: -0.001,
  },
  {
    at: 0.28,
    position: [-1.25, 3.4, -36],
    target: [0, 2.8, -92],
    fov: 58,
    roll: -0.001,
  },
  {
    at: 0.34,
    position: [0, 3.18, -38.2],
    target: [0, 3.02, -126],
    fov: 61,
    roll: 0,
  },
  {
    at: 0.44,
    position: [0.05, 3.28, -38.25],
    target: [0, 3.04, -144],
    fov: 57,
    roll: 0,
  },
  {
    at: 0.52,
    position: [0.4, 3.55, -33],
    target: [0, 2.35, -78],
    fov: 55,
    roll: 0.001,
  },
  {
    at: 0.62,
    position: [0.8, 4.35, -28],
    target: [0, 1.75, -62],
    fov: 52,
    roll: 0.001,
  },
  {
    at: 0.72,
    position: [0.6, 5.25, -24.5],
    target: [0, 1.55, -70],
    fov: 49,
    roll: 0.001,
  },
  {
    at: 0.82,
    position: [0.35, 6.3, -20],
    target: [0, 1.35, -80],
    fov: 50,
    roll: 0.001,
  },
  {
    at: 1,
    position: [0, 7.6, -12],
    target: [0, 1.2, -96],
    fov: 51,
    roll: 0,
  },
];

function sampleCameraPath(keyframes, progress, position, target) {
  const endIndex = keyframes.findIndex((keyframe) => progress <= keyframe.at);
  const nextIndex = endIndex < 0 ? keyframes.length - 1 : Math.max(1, endIndex);
  const previous = keyframes[nextIndex - 1];
  const next = keyframes[nextIndex];
  const t = THREE.MathUtils.smoothstep(progress, previous.at, next.at);

  position.lerpVectors(new THREE.Vector3(...previous.position), new THREE.Vector3(...next.position), t);
  target.lerpVectors(new THREE.Vector3(...previous.target), new THREE.Vector3(...next.target), t);

  return {
    fov: THREE.MathUtils.lerp(previous.fov, next.fov, t),
    roll: THREE.MathUtils.lerp(previous.roll, next.roll, t),
  };
}

export default function FirstRoadCameraRig() {
  const scroll = useFirstRoadScroll();
  const { camera, pointer, size } = useThree();
  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const targetLookAt = useMemo(() => new THREE.Vector3(), []);
  const smoothedPosition = useMemo(() => new THREE.Vector3(-2.6, 4.8, -19), []);
  const smoothedLookAt = useMemo(() => new THREE.Vector3(0, 1.75, -54), []);
  const pointerOffset = useRef(new THREE.Vector2());
  const smoothedFov = useRef(44);
  const smoothedRoll = useRef(-0.003);

  useFrame(({ clock }, delta) => {
    const p = scroll.offset;
    const mobile = size.width < 768;
    const pose = sampleCameraPath(mobile ? MOBILE_KEYFRAMES : DESKTOP_KEYFRAMES, p, targetPosition, targetLookAt);
    const driverPov = THREE.MathUtils.smoothstep(p, 0.25, 0.34) * (1 - THREE.MathUtils.smoothstep(p, 0.44, 0.54));
    const overhead = THREE.MathUtils.smoothstep(p, 0.74, 0.9);

    pointerOffset.current.x = THREE.MathUtils.damp(pointerOffset.current.x, pointer.x, 5, delta);
    pointerOffset.current.y = THREE.MathUtils.damp(pointerOffset.current.y, pointer.y, 5, delta);

    const parallax = THREE.MathUtils.lerp(1, 0.04, driverPov) * THREE.MathUtils.lerp(1, 0.32, overhead);
    targetPosition.x += pointerOffset.current.x * (mobile ? 0.1 : 0.26) * parallax;
    targetPosition.y += pointerOffset.current.y * (mobile ? 0.04 : 0.1) * parallax;
    targetLookAt.x += pointerOffset.current.x * (mobile ? 0.06 : 0.14) * parallax;

    const suspension = Math.sin(clock.elapsedTime * 8.2) * 0.008 * (1 - overhead);
    targetPosition.y += suspension;
    targetLookAt.y += suspension * 0.25;

    smoothedPosition.x = THREE.MathUtils.damp(smoothedPosition.x, targetPosition.x, 7, delta);
    smoothedPosition.y = THREE.MathUtils.damp(smoothedPosition.y, targetPosition.y, 7, delta);
    smoothedPosition.z = THREE.MathUtils.damp(smoothedPosition.z, targetPosition.z, 7, delta);
    smoothedLookAt.x = THREE.MathUtils.damp(smoothedLookAt.x, targetLookAt.x, 8, delta);
    smoothedLookAt.y = THREE.MathUtils.damp(smoothedLookAt.y, targetLookAt.y, 8, delta);
    smoothedLookAt.z = THREE.MathUtils.damp(smoothedLookAt.z, targetLookAt.z, 8, delta);
    smoothedFov.current = THREE.MathUtils.damp(smoothedFov.current, pose.fov, 7, delta);
    smoothedRoll.current = THREE.MathUtils.damp(smoothedRoll.current, pose.roll, 7, delta);

    camera.position.copy(smoothedPosition);
    camera.lookAt(smoothedLookAt);
    camera.rotation.z = smoothedRoll.current;
    camera.fov = smoothedFov.current;
    camera.updateProjectionMatrix();
  });

  return null;
}
