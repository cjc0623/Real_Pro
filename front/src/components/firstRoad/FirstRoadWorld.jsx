import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import {
  clamp01,
  createRandom,
  getLightingProfile,
  makeCanvasTexture,
  smoothstep,
} from "./firstRoadMath";
import { useFirstRoadScroll } from "./FirstRoadScrollContext.jsx";

const roadVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const roadFragmentShader = `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uFarStart;
  uniform float uFarEnd;
  uniform float uEdgeFade;

  varying vec2 vUv;

  void main() {
    vec4 texel = texture2D(uMap, vUv);
    float nearFade = smoothstep(0.0, 0.045, vUv.y);
    float farFade = 1.0 - smoothstep(uFarStart, uFarEnd, vUv.y);
    float leftFade = smoothstep(0.0, uEdgeFade, vUv.x);
    float rightFade = 1.0 - smoothstep(1.0 - uEdgeFade, 1.0, vUv.x);
    float alpha = uOpacity * nearFade * farFade * leftFade * rightFade;

    vec3 color = texel.rgb * uColor;
    color += (texel.rgb - 0.5) * 0.08;
    gl_FragColor = vec4(color, alpha);
  }
`;

function createRoadTexture() {
  const texture = makeCanvasTexture(1024, 2048, (ctx, width, height) => {
    const random = createRandom(812);
    const base = ctx.createLinearGradient(0, 0, width, 0);
    base.addColorStop(0, "#121615");
    base.addColorStop(0.22, "#252a28");
    base.addColorStop(0.5, "#3f413b");
    base.addColorStop(0.78, "#252b29");
    base.addColorStop(1, "#101413");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 1800; i += 1) {
      const x = random() * width;
      const y = random() * height;
      const length = 16 + random() * 90;
      ctx.strokeStyle = `rgba(235,232,204,${0.01 + random() * 0.034})`;
      ctx.lineWidth = 0.5 + random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (random() - 0.5) * 4, y + length);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "multiply";
    const crown = ctx.createRadialGradient(width * 0.5, height * 0.42, 80, width * 0.5, height * 0.5, width * 0.7);
    crown.addColorStop(0, "rgba(255,255,255,0)");
    crown.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = crown;
    ctx.fillRect(0, 0, width, height);
  });

  texture.repeat.set(1, 2.1);
  return texture;
}

function createShoulderTexture() {
  const texture = makeCanvasTexture(1024, 1024, (ctx, width, height) => {
    const random = createRandom(418);
    const base = ctx.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, "#0d1513");
    base.addColorStop(0.44, "#1e2a25");
    base.addColorStop(0.72, "#363827");
    base.addColorStop(1, "#4b432b");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "soft-light";
    for (let i = 0; i < 980; i += 1) {
      const x = random() * width;
      const y = random() * height;
      const length = 16 + random() * 130;
      ctx.strokeStyle =
        random() > 0.45
          ? `rgba(205,186,112,${0.014 + random() * 0.04})`
          : `rgba(8,27,24,${0.04 + random() * 0.09})`;
      ctx.lineWidth = 1 + random() * 4.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x + length * 0.24,
        y - 8 + random() * 20,
        x + length * 0.7,
        y + 10 + random() * 34,
        x + length,
        y + (random() - 0.5) * 32
      );
      ctx.stroke();
    }
  });

  texture.repeat.set(1, 1.6);
  return texture;
}

function createFogTexture(seed = 1) {
  const texture = makeCanvasTexture(1024, 512, (ctx, width, height) => {
    const random = createRandom(seed);
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < 72; i += 1) {
      const y = height * (0.18 + random() * 0.62);
      const x = width * (random() - 0.25);
      const length = width * (0.35 + random() * 0.85);
      const thickness = 8 + random() * 40;
      const alpha = 0.025 + random() * 0.082;
      ctx.strokeStyle = `rgba(223,240,238,${alpha})`;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x + length * 0.26,
        y - 34 + random() * 68,
        x + length * 0.72,
        y + 30 - random() * 58,
        x + length,
        y + (random() - 0.5) * 60
      );
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "destination-in";
    const feather = ctx.createRadialGradient(width * 0.5, height * 0.54, width * 0.05, width * 0.5, height * 0.54, width * 0.58);
    feather.addColorStop(0, "rgba(255,255,255,1)");
    feather.addColorStop(0.62, "rgba(255,255,255,0.9)");
    feather.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = feather;
    ctx.fillRect(0, 0, width, height);
  });

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createGlowTexture() {
  const texture = makeCanvasTexture(512, 512, (ctx, width, height) => {
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.5);
    gradient.addColorStop(0, "rgba(255,232,164,0.88)");
    gradient.addColorStop(0.28, "rgba(255,206,118,0.28)");
    gradient.addColorStop(0.68, "rgba(255,206,118,0.06)");
    gradient.addColorStop(1, "rgba(255,206,118,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createFadingMaterial(map, color, opacity, edgeFade = 0.02) {
  return new THREE.ShaderMaterial({
    vertexShader: roadVertexShader,
    fragmentShader: roadFragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMap: { value: map },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uFarStart: { value: 0.58 },
      uFarEnd: { value: 0.84 },
      uEdgeFade: { value: edgeFade },
    },
  });
}

function RoadStage() {
  const scroll = useFirstRoadScroll();
  const roadTexture = useMemo(() => createRoadTexture(), []);
  const shoulderTexture = useMemo(() => createShoulderTexture(), []);
  const lineGroupRef = useRef();
  const railGroupRef = useRef();
  const railPositions = useMemo(() => Array.from({ length: 16 }).map((_, index) => 66 - index * 19.5), []);

  const materials = useMemo(
    () => ({
      road: createFadingMaterial(roadTexture, "#444640", 0.78, 0.08),
      shoulder: createFadingMaterial(shoulderTexture, "#273029", 0.42, 0.38),
      line: new THREE.MeshBasicMaterial({
        color: "#f3f5ee",
        transparent: true,
        opacity: 0.72,
        fog: true,
      }),
      rail: new THREE.MeshBasicMaterial({ color: "#566261", transparent: true, opacity: 0.62, fog: true }),
    }),
    [roadTexture, shoulderTexture]
  );

  useFrame((_, delta) => {
    const p = scroll.offset;
    const profile = getLightingProfile(p);
    const speed = profile.foregroundSpeed || 58;
    const night = 1 - smoothstep(0.22, 0.58, p);
    const dawn = smoothstep(0.42, 0.82, p);
    const morning = smoothstep(0.7, 1, profile.phase);
    const routeClear = 1 - smoothstep(0.56, 0.72, p);

    roadTexture.offset.y -= delta * speed * 0.00045;
    shoulderTexture.offset.y -= delta * speed * 0.00022;

    materials.road.uniforms.uColor.value.lerpColors(
      new THREE.Color("#242725"),
      new THREE.Color("#626057"),
      profile.roadBrightness
    );
    materials.road.uniforms.uColor.value.lerp(new THREE.Color("#54452e"), morning * 0.08);
    materials.road.uniforms.uFarStart.value = THREE.MathUtils.lerp(0.5, 0.62, dawn);
    materials.road.uniforms.uFarEnd.value = THREE.MathUtils.lerp(0.78, 0.88, dawn);
    materials.road.uniforms.uOpacity.value = THREE.MathUtils.lerp(0.76, 0.68, morning);

    materials.shoulder.uniforms.uColor.value.lerpColors(
      new THREE.Color("#1c2420"),
      new THREE.Color("#45473b"),
      profile.roadBrightness
    );
    materials.shoulder.uniforms.uOpacity.value = THREE.MathUtils.lerp(0.4, 0.28, morning);
    materials.shoulder.uniforms.uFarStart.value = THREE.MathUtils.lerp(0.36, 0.48, dawn);
    materials.shoulder.uniforms.uFarEnd.value = THREE.MathUtils.lerp(0.64, 0.76, dawn);

    materials.line.opacity = 0.34 + night * 0.12 + profile.roadBrightness * 0.12;
    materials.rail.color.lerpColors(new THREE.Color("#384442"), new THREE.Color("#777970"), profile.roadBrightness);
    materials.rail.opacity = THREE.MathUtils.lerp(0.18, 0.32, profile.roadBrightness) * routeClear;

    if (lineGroupRef.current) {
      lineGroupRef.current.children.forEach((line) => {
        line.position.z += delta * speed;
        if (line.position.z > 32) line.position.z -= 248;
      });
    }

    if (railGroupRef.current) {
      railGroupRef.current.children.forEach((rail) => {
        rail.position.z += delta * speed;
        if (rail.position.z > 32) rail.position.z -= 312;
      });
    }
  });

  return (
    <group>
      <mesh position={[0, -1.15, -180]} rotation={[-Math.PI / 2, 0, 0]} material={materials.road} renderOrder={3}>
        <planeGeometry args={[20.5, 500]} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={`side-${side}`}>
          <mesh position={[side * 13.2, -1.18, -180]} rotation={[-Math.PI / 2, 0, 0]} material={materials.shoulder} renderOrder={2}>
            <planeGeometry args={[5.8, 500]} />
          </mesh>
        </group>
      ))}

      <group ref={railGroupRef}>
        {railPositions.map((z, index) => (
          <group key={index} position={[0, -0.23, z]}>
            {[-1, 1].map((side) => (
              <group key={side} position={[side * 14.3, 0, 0]}>
                <mesh position={[0, 0.52, 0]} material={materials.rail}>
                  <boxGeometry args={[0.085, 0.075, 16.8]} />
                </mesh>
                <mesh position={[0, 0.18, -7.9]} material={materials.rail}>
                  <boxGeometry args={[0.085, 0.54, 0.085]} />
                </mesh>
                <mesh position={[0, 0.18, 7.9]} material={materials.rail}>
                  <boxGeometry args={[0.085, 0.54, 0.085]} />
                </mesh>
              </group>
            ))}
          </group>
        ))}
      </group>

      <group ref={lineGroupRef}>
        {Array.from({ length: 34 }).map((_, index) => (
          <group key={index} position={[0, -1.055, 30 - index * 7.3]}>
            {[-4.7, 4.7].map((x) => (
              <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.line} renderOrder={7}>
                <planeGeometry args={[0.2, 3.2]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

function ValleyFog() {
  const scroll = useFirstRoadScroll();
  const nearFogRef = useRef();
  const horizonFogRef = useRef();
  const sideFogRef = useRef([]);
  const glowRef = useRef();
  const nearFog = useMemo(() => createFogTexture(934), []);
  const horizonFog = useMemo(() => createFogTexture(1207), []);
  const glowTexture = useMemo(() => createGlowTexture(), []);

  useFrame((_, delta) => {
    const p = scroll.offset;
    const profile = getLightingProfile(p);
    const night = 1 - smoothstep(0.22, 0.52, p);
    const dawn = smoothstep(0.34, 0.82, p);
    const morning = smoothstep(0.72, 1, profile.phase);

    nearFog.offset.x = (nearFog.offset.x + delta * (0.018 + dawn * 0.026)) % 1;
    horizonFog.offset.x = (horizonFog.offset.x - delta * (0.012 + dawn * 0.018)) % 1;

    if (nearFogRef.current) {
      nearFogRef.current.opacity = clamp01(0.012 + dawn * 0.045 + night * 0.018 - morning * 0.038);
      nearFogRef.current.color.lerpColors(new THREE.Color("#9bb1b2"), new THREE.Color("#f0e4c8"), morning);
    }

    if (horizonFogRef.current) {
      horizonFogRef.current.opacity = clamp01(0.035 + dawn * 0.075 + night * 0.025 - morning * 0.06);
      horizonFogRef.current.color.lerpColors(new THREE.Color("#6e8587"), new THREE.Color("#eadfc4"), morning);
    }

    sideFogRef.current.forEach((material, index) => {
      if (!material) return;
      material.opacity = clamp01(0.006 + dawn * 0.014 + night * 0.006 - morning * 0.014);
      material.color.lerpColors(new THREE.Color(index === 0 ? "#647a7d" : "#748b8b"), new THREE.Color("#ded2b8"), morning);
    });

    if (glowRef.current) {
      glowRef.current.opacity = clamp01(0.01 + morning * 0.04 + profile.blast * 0.015);
      glowRef.current.color.lerpColors(new THREE.Color("#d9b066"), new THREE.Color("#fff0bf"), morning);
    }
  });

  return (
    <group>
      <sprite position={[0, 5.6, -78]} scale={[52, 12, 1]} renderOrder={18}>
        <spriteMaterial
          ref={nearFogRef}
          map={nearFog}
          color="#9bb1b2"
          transparent
          opacity={0.16}
          depthWrite={false}
          fog={false}
        />
      </sprite>

      <sprite position={[0, 11, -226]} scale={[170, 32, 1]} renderOrder={19}>
        <spriteMaterial
          ref={horizonFogRef}
          map={horizonFog}
          color="#6e8587"
          transparent
          opacity={0.4}
          depthWrite={false}
          fog={false}
        />
      </sprite>

      {[-1, 1].map((side, index) => (
        <sprite key={side} position={[side * 36, 9.5, -112]} scale={[34, 9, 1]} renderOrder={20}>
          <spriteMaterial
            ref={(material) => {
              sideFogRef.current[index] = material;
            }}
            map={nearFog}
            color="#647a7d"
            transparent
            opacity={0.04}
            depthWrite={false}
            fog={false}
          />
        </sprite>
      ))}

      <sprite position={[0, 50, -218]} scale={[88, 48, 1]} renderOrder={17}>
        <spriteMaterial
          ref={glowRef}
          map={glowTexture}
          color="#d9b066"
          transparent
          opacity={0.04}
          depthWrite={false}
          fog={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
}

export default function FirstRoadWorld() {
  return (
    <group>
      <RoadStage />
      <ValleyFog />
    </group>
  );
}
