import * as THREE from "three";

export const FIRST_ROAD_TRUCK_ANCHOR = Object.freeze({
  x: 0,
  y: -3.0,
  z: -54,
});

export function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(edge0, edge1, value) {
  const x = clamp01((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

export function getTimePhase(p) {
  if (p < 0.42) return 0;
  if (p < 0.61) return ((p - 0.42) / 0.19) * 0.34;
  if (p < 0.82) return 0.34 + ((p - 0.61) / 0.21) * 0.38;
  return 0.72 + ((p - 0.82) / 0.18) * 0.28;
}

export function getLightingProfile(p) {
  const night = 1 - smoothstep(0.26, 0.54, p);
  const predawn = smoothstep(0.34, 0.62, p) * (1 - smoothstep(0.7, 0.86, p));
  const dawn = smoothstep(0.54, 0.78, p);
  const morning = smoothstep(0.88, 1, p);
  const artificialFade = smoothstep(0.5, 0.76, p);
  const fogRise = smoothstep(0.4, 0.62, p) * (1 - smoothstep(0.72, 0.9, p));
  const headlightBlast = smoothstep(0.73, 0.82, p) * (1 - smoothstep(0.84, 0.9, p));
  const whiteHold = smoothstep(0.86, 0.91, p) * (1 - smoothstep(0.945, 0.985, p));
  const naturalLight = dawn * 0.45 + morning * 0.55;

  return {
    phase: getTimePhase(p),
    night,
    predawn,
    dawn,
    morning,
    ambient: THREE.MathUtils.lerp(0.1, 1.38, naturalLight),
    sun: THREE.MathUtils.lerp(0.02, 2.65, dawn * 0.24 + morning * 0.76),
    street: THREE.MathUtils.lerp(820, 0, artificialFade),
    headlight: THREE.MathUtils.lerp(520, 8, artificialFade) + headlightBlast * 180,
    headlightDistance: THREE.MathUtils.lerp(360, 62, artificialFade) + headlightBlast * 80,
    headlightAngle: THREE.MathUtils.lerp(0.12, 0.07, artificialFade) + headlightBlast * 0.025,
    roadBeamOpacity: THREE.MathUtils.lerp(0.6, 0.02, artificialFade) + headlightBlast * 0.08,
    fogDensity: Math.max(0.00065, 0.00135 + fogRise * 0.0007 + predawn * 0.00025 - morning * 0.00075),
    roadBrightness: THREE.MathUtils.lerp(0, 1, dawn * 0.28 + morning * 0.72),
    mountainVisibility: THREE.MathUtils.lerp(0.22, 1, smoothstep(0.36, 0.86, p)),
    foregroundSpeed: THREE.MathUtils.lerp(56, 92, smoothstep(0.24, 0.68, p)) - morning * 22,
    blast: headlightBlast,
    whiteHold,
  };
}

export function createRandom(seed) {
  let value = seed;

  return () => {
    value = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
  };
}

export function makeCanvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;

  return texture;
}
