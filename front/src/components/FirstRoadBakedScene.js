import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0, edge1, value) {
  const x = clamp01((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function getProfile(getLightingProfile, p) {
  if (typeof getLightingProfile === "function") return getLightingProfile(p);

  return {
    phase: p,
    roadBrightness: smoothstep(0.54, 1, p),
    blast: 0,
  };
}

function createRandom(seed) {
  let value = seed;

  return () => {
    value = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
  };
}

function makeTexture(width, height, draw) {
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

function createRoadTexture() {
  return makeTexture(1024, 2048, (ctx, width, height) => {
    const random = createRandom(12);
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#20282a");
    gradient.addColorStop(0.26, "#4b5351");
    gradient.addColorStop(0.5, "#73786f");
    gradient.addColorStop(0.74, "#4b5351");
    gradient.addColorStop(1, "#20282a");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 1900; i += 1) {
      const x = random() * width;
      const y = random() * height;
      const length = 18 + random() * 105;
      const alpha = 0.018 + random() * 0.07;

      ctx.strokeStyle = `rgba(255,255,245,${alpha})`;
      ctx.lineWidth = 0.7 + random() * 2.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (random() - 0.5) * 8, y + length);
      ctx.stroke();
    }

    for (let i = 0; i < 220; i += 1) {
      const x = width * (0.18 + random() * 0.64);
      const y = random() * height;
      const radius = 18 + random() * 92;
      const spot = ctx.createRadialGradient(x, y, 0, x, y, radius);
      spot.addColorStop(0, `rgba(255,247,216,${0.02 + random() * 0.055})`);
      spot.addColorStop(1, "rgba(255,247,216,0)");
      ctx.fillStyle = spot;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  });
}

function createTerrainTexture() {
  return makeTexture(1024, 1024, (ctx, width, height) => {
    const random = createRandom(34);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#14231c");
    gradient.addColorStop(0.35, "#31472e");
    gradient.addColorStop(0.72, "#68764a");
    gradient.addColorStop(1, "#a69056");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 1150; i += 1) {
      const x = random() * width;
      const y = random() * height;
      const length = 38 + random() * 210;
      const warm = random() > 0.56;

      ctx.strokeStyle = warm
        ? `rgba(231,190,94,${0.026 + random() * 0.075})`
        : `rgba(5,38,25,${0.04 + random() * 0.12})`;
      ctx.lineWidth = 2 + random() * 9;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x + length * 0.24,
        y - 18 + random() * 34,
        x + length * 0.68,
        y - 22 + random() * 48,
        x + length,
        y + (random() - 0.5) * 60
      );
      ctx.stroke();
    }

    for (let i = 0; i < 2600; i += 1) {
      const alpha = 0.012 + random() * 0.04;
      ctx.fillStyle = `rgba(255,245,205,${alpha})`;
      ctx.fillRect(random() * width, random() * height, 1 + random() * 3, 1 + random() * 4);
    }
  });
}

function createMountainCutoutTexture(seed, palette) {
  return makeTexture(1024, 512, (ctx, width, height) => {
    const random = createRandom(seed);
    const ridge = [];
    const steps = 24;

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const wave =
        Math.sin(t * Math.PI * 1.25 + seed) * 46 +
        Math.sin(t * Math.PI * 3.7 + seed * 0.2) * 24 +
        (random() - 0.5) * 34;
      const y = height * (0.34 + palette.heightBias) - Math.pow(Math.sin(t * Math.PI), 0.8) * palette.peak + wave;
      ridge.push([t * width, Math.max(34, Math.min(height * 0.76, y))]);
    }

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(0, height);
    ridge.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(width, height);
    ctx.closePath();

    const fill = ctx.createLinearGradient(0, 0, width, height);
    fill.addColorStop(0, palette.light);
    fill.addColorStop(0.36, palette.mid);
    fill.addColorStop(0.78, palette.dark);
    fill.addColorStop(1, palette.base);
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.save();
    ctx.clip();

    for (let i = 0; i < 760; i += 1) {
      const x = random() * width;
      const y = random() * height;
      const length = 60 + random() * 260;
      const down = 24 + random() * 110;
      const light = random() > 0.54;

      ctx.strokeStyle = light
        ? `rgba(218,222,142,${0.035 + random() * 0.10})`
        : `rgba(6,20,17,${0.045 + random() * 0.13})`;
      ctx.lineWidth = 3 + random() * 13;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x + length * 0.26,
        y + down * 0.08,
        x + length * 0.72,
        y + down,
        x + length,
        y + down * 0.72
      );
      ctx.stroke();
    }

    for (let i = 0; i < 110; i += 1) {
      const x = random() * width;
      const y = random() * height * 0.72;
      const radius = 36 + random() * 120;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, `rgba(255,222,133,${0.03 + random() * 0.065})`);
      glow.addColorStop(1, "rgba(255,222,133,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    ctx.restore();

    ctx.globalCompositeOperation = "destination-in";
    const fade = ctx.createLinearGradient(0, 0, width, 0);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(0.08, "rgba(0,0,0,1)");
    fade.addColorStop(0.92, "rgba(0,0,0,1)");
    fade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
  });
}

function createGlowTexture() {
  return makeTexture(512, 512, (ctx, width, height) => {
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.5);
    gradient.addColorStop(0, "rgba(255,238,182,1)");
    gradient.addColorStop(0.22, "rgba(255,204,120,0.58)");
    gradient.addColorStop(0.56, "rgba(255,177,118,0.18)");
    gradient.addColorStop(1, "rgba(255,177,118,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });
}

function createHazeTexture() {
  return makeTexture(512, 512, (ctx, width, height) => {
    const gradient = ctx.createRadialGradient(
      width * 0.5,
      height * 0.54,
      0,
      width * 0.5,
      height * 0.54,
      width * 0.62
    );
    gradient.addColorStop(0, "rgba(255,241,205,0.86)");
    gradient.addColorStop(0.34, "rgba(255,236,198,0.34)");
    gradient.addColorStop(0.68, "rgba(255,236,198,0.08)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });
}

function createTerrainGeometry(side = 1) {
  const rows = 34;
  const segments = 260;
  const zMin = -940;
  const zMax = 660;
  const vertices = [];
  const uvs = [];
  const indices = [];

  for (let zi = 0; zi <= segments; zi += 1) {
    const v = zi / segments;
    const z = THREE.MathUtils.lerp(zMin, zMax, v);

    for (let ri = 0; ri <= rows; ri += 1) {
      const t = ri / rows;
      const startX = 31.6;
      const endX = 330;
      const softCurve = Math.pow(t, 1.18);
      const xNoise =
        Math.sin(z * 0.014 + t * 5.0) * t * 3.2 +
        Math.cos(z * 0.006 - t * 2.6) * t * 5.2;
      const x = side * (startX + softCurve * (endX - startX) + xNoise);

      const bank = Math.pow(t, 1.58) * 8.6;
      const roadBlend = 1 - smoothstep(0.0, 0.16, t);
      const rolling =
        Math.sin(z * 0.017 + t * 4.4) * 0.62 * t +
        Math.cos(z * 0.008 - t * 5.1) * 0.82 * t;
      const y = -1.22 + bank + rolling - roadBlend * 0.16;

      vertices.push(x, y, z);
      uvs.push(t * 1.8, v * 7.2);
    }
  }

  for (let zi = 0; zi < segments; zi += 1) {
    for (let ri = 0; ri < rows; ri += 1) {
      const a = zi * (rows + 1) + ri;
      const b = a + 1;
      const c = a + rows + 1;
      const d = c + 1;
      if (side > 0) indices.push(a, c, b, b, c, d);
      else indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function MountainCards({ getLightingProfile }) {
  const scroll = useScroll();
  const groupRef = useRef();

  const textures = useMemo(
    () => [
      createMountainCutoutTexture(64, {
        heightBias: 0.10,
        peak: 78,
        light: "#809064",
        mid: "#475b3d",
        dark: "#193028",
        base: "#07110f",
      }),
      createMountainCutoutTexture(92, {
        heightBias: 0.04,
        peak: 102,
        light: "#a0aa72",
        mid: "#536840",
        dark: "#20372d",
        base: "#0a1512",
      }),
      createMountainCutoutTexture(127, {
        heightBias: -0.02,
        peak: 132,
        light: "#c3b777",
        mid: "#6a7845",
        dark: "#2f442e",
        base: "#122019",
      }),
    ],
    []
  );

  const materials = useMemo(
    () =>
      textures.map(
        (texture, index) =>
          new THREE.MeshBasicMaterial({
            map: texture,
            color: index === 0 ? "#283532" : index === 1 ? "#425341" : "#66734d",
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            fog: true,
          })
      ),
    [textures]
  );

  const cards = useMemo(
    () => [
      { key: "far-left", side: -1, layer: 0, x: -165, y: 52, z: -720, width: 360, height: 172, rot: 0.04 },
      { key: "far-right", side: 1, layer: 0, x: 165, y: 52, z: -720, width: 360, height: 172, rot: -0.04 },
      { key: "mid-left", side: -1, layer: 1, x: -152, y: 58, z: -470, width: 340, height: 190, rot: 0.1 },
      { key: "mid-right", side: 1, layer: 1, x: 152, y: 58, z: -470, width: 340, height: 190, rot: -0.1 },
      { key: "near-left", side: -1, layer: 2, x: -205, y: 72, z: -210, width: 360, height: 232, rot: 0.2 },
      { key: "near-right", side: 1, layer: 2, x: 205, y: 72, z: -210, width: 360, height: 232, rot: -0.2 },
    ],
    []
  );

  useFrame((_, delta) => {
    const p = scroll.offset;
    const profile = getProfile(getLightingProfile, p);
    const phase = profile.phase || 0;
    const brightness = profile.roadBrightness || 0;
    const dawn = smoothstep(0.22, 0.78, phase);
    const morning = smoothstep(0.70, 1, phase);

    materials.forEach((material, index) => {
      const night = new THREE.Color(index === 0 ? "#111a1a" : "#17231f");
      const day = new THREE.Color(index === 0 ? "#415449" : index === 1 ? "#627044" : "#8c8c52");
      const warm = new THREE.Color(index === 0 ? "#53633f" : "#9c8b54");
      material.color.lerpColors(night, day, dawn);
      material.color.lerp(warm, morning * 0.34 + brightness * 0.08);
      material.opacity = 0.62 + dawn * 0.2 + morning * 0.18;
    });

    if (groupRef.current) {
      groupRef.current.children.forEach((card) => {
        const factor = card.userData.parallax || 1;
        card.position.z += delta * (p < 0.36 ? 2.2 : p < 0.7 ? 4.2 : 5.2) * factor;
        if (card.position.z > 80) card.position.z -= 980;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {[0, -980].map((offset) =>
        cards.map((card) => (
          <mesh
            key={`${card.key}-${offset}`}
            userData={{ parallax: 1 + card.layer * 0.32 }}
            position={[card.x, card.y, card.z + offset]}
            rotation={[0, card.rot, 0]}
            material={materials[card.layer]}
            renderOrder={2 + card.layer}
          >
            <planeGeometry args={[card.width, card.height, 1, 1]} />
          </mesh>
        ))
      )}
    </group>
  );
}

function BakedTerrain({ getLightingProfile }) {
  const scroll = useScroll();
  const groupRef = useRef();

  const terrainTexture = useMemo(() => {
    const texture = createTerrainTexture();
    texture.repeat.set(1.35, 6);
    return texture;
  }, []);

  const leftGeometry = useMemo(() => createTerrainGeometry(-1), []);
  const rightGeometry = useMemo(() => createTerrainGeometry(1), []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: terrainTexture,
        color: "#26372c",
        fog: true,
      }),
    [terrainTexture]
  );

  useFrame((_, delta) => {
    const p = scroll.offset;
    const profile = getProfile(getLightingProfile, p);
    const brightness = profile.roadBrightness || 0;
    const phase = profile.phase || 0;
    const dawn = smoothstep(0.28, 0.78, phase);
    const morning = smoothstep(0.72, 1, phase);

    material.color.lerpColors(new THREE.Color("#17231e"), new THREE.Color("#68754c"), dawn);
    material.color.lerp(new THREE.Color("#b69b58"), morning * 0.34 + brightness * 0.1);

    if (groupRef.current) {
      const speed = p < 0.36 ? 10 : p < 0.70 ? 18 : 22;
      groupRef.current.children.forEach((chunk) => {
        chunk.position.z += delta * speed;
        if (chunk.position.z > 770) chunk.position.z -= 1540;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {[0, -770].map((offset) => (
        <group key={offset} position={[0, 0, offset]}>
          <mesh geometry={leftGeometry} material={material} renderOrder={5} />
          <mesh geometry={rightGeometry} material={material} renderOrder={5} />
        </group>
      ))}
    </group>
  );
}

function BakedRoad({ getLightingProfile }) {
  const scroll = useScroll();
  const lineGroupRef = useRef();

  const roadTexture = useMemo(() => {
    const texture = createRoadTexture();
    texture.repeat.set(1, 7.2);
    return texture;
  }, []);

  const materials = useMemo(
    () => ({
      road: new THREE.MeshBasicMaterial({ map: roadTexture, color: "#535b58", fog: true }),
      shoulder: new THREE.MeshBasicMaterial({ color: "#4b5147", fog: true }),
      line: new THREE.MeshBasicMaterial({ color: "#edf2ec", transparent: true, opacity: 0.72, fog: true }),
      guard: new THREE.MeshBasicMaterial({ color: "#899494", fog: true }),
      softEdge: new THREE.MeshBasicMaterial({
        color: "#eadcae",
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        fog: true,
      }),
    }),
    [roadTexture]
  );

  useFrame((_, delta) => {
    const p = scroll.offset;
    const profile = getProfile(getLightingProfile, p);
    const brightness = profile.roadBrightness || 0;
    const phase = profile.phase || 0;
    const warm = smoothstep(0.70, 1, phase);
    const speed = p < 0.36 ? 70 : p < 0.70 ? 118 : 92;

    materials.road.color.lerpColors(new THREE.Color("#242b2c"), new THREE.Color("#817a64"), brightness);
    materials.road.color.lerp(new THREE.Color("#b1a16d"), warm * 0.15);
    materials.shoulder.color.lerpColors(new THREE.Color("#29302d"), new THREE.Color("#8f815d"), brightness);
    materials.guard.color.lerpColors(new THREE.Color("#586164"), new THREE.Color("#d7d2bc"), brightness);
    materials.softEdge.opacity = 0.06 + warm * 0.18 + brightness * 0.08;

    if (lineGroupRef.current) {
      lineGroupRef.current.children.forEach((line) => {
        line.position.z += delta * speed;
        if (line.position.z > 22) line.position.z -= 260;
      });
    }
  });

  return (
    <group>
      <mesh position={[0, -1.1, -300]} rotation={[-Math.PI / 2, 0, 0]} material={materials.road} renderOrder={10}>
        <planeGeometry args={[44, 1600]} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={`road-side-${side}`}>
          <mesh position={[side * 27.6, -1.105, -300]} rotation={[-Math.PI / 2, 0, 0]} material={materials.shoulder} renderOrder={9}>
            <planeGeometry args={[10.8, 1600]} />
          </mesh>
          <mesh position={[side * 34.3, -1.095, -300]} rotation={[-Math.PI / 2, 0, 0]} material={materials.softEdge} renderOrder={12}>
            <planeGeometry args={[9.5, 1600]} />
          </mesh>
          <mesh position={[side * 22.2, -1.045, -300]} rotation={[-Math.PI / 2, 0, 0]} material={materials.line} renderOrder={13}>
            <planeGeometry args={[0.32, 1600]} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={`guard-${side}`} position={[side * 37.6, 0.06, -300]}>
          <mesh position={[0, 0.66, 0]} material={materials.guard}>
            <boxGeometry args={[0.18, 0.16, 1500]} />
          </mesh>
          {Array.from({ length: 34 }).map((_, i) => (
            <mesh key={i} position={[0, 0.2, 670 - i * 46]} material={materials.guard}>
              <boxGeometry args={[0.14, 0.82, 0.14]} />
            </mesh>
          ))}
        </group>
      ))}

      <group ref={lineGroupRef}>
        {Array.from({ length: 34 }).map((_, i) => (
          <group key={i} position={[0, -1.035, -i * 12]}>
            {[-7.7, 7.7].map((x) => (
              <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.line} renderOrder={14}>
                <planeGeometry args={[0.34, 5.2]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

function BakedAtmosphere({ getLightingProfile }) {
  const scroll = useScroll();
  const sunMaterialRef = useRef();
  const horizonMaterialRef = useRef();
  const roadHazeMaterialRef = useRef();

  const glowTexture = useMemo(() => createGlowTexture(), []);
  const hazeTexture = useMemo(() => createHazeTexture(), []);

  useFrame(() => {
    const p = scroll.offset;
    const profile = getProfile(getLightingProfile, p);
    const phase = profile.phase || 0;
    const dawn = smoothstep(0.34, 0.82, phase);
    const morning = smoothstep(0.72, 1, phase);
    const blast = profile.blast || 0;

    if (sunMaterialRef.current) {
      sunMaterialRef.current.opacity = clamp01(morning * 0.54 + dawn * 0.18 + blast * 0.08);
      sunMaterialRef.current.color.lerpColors(new THREE.Color("#ffd2a2"), new THREE.Color("#fff0bd"), morning);
    }

    if (horizonMaterialRef.current) {
      horizonMaterialRef.current.opacity = clamp01(0.08 + dawn * 0.22 + morning * 0.2 + blast * 0.1);
      horizonMaterialRef.current.color.lerpColors(new THREE.Color("#b7ccd0"), new THREE.Color("#ffd7a2"), morning);
    }

    if (roadHazeMaterialRef.current) {
      roadHazeMaterialRef.current.opacity = clamp01(0.13 + dawn * 0.22 + blast * 0.22);
      roadHazeMaterialRef.current.color.lerpColors(new THREE.Color("#d5e6e9"), new THREE.Color("#ffd8a0"), morning);
    }
  });

  return (
    <group>
      <sprite position={[0, 64, -720]} scale={[340, 170, 1]}>
        <spriteMaterial
          ref={sunMaterialRef}
          map={glowTexture}
          color="#ffd2a2"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <sprite position={[0, 26, -500]} scale={[600, 230, 1]}>
        <spriteMaterial
          ref={horizonMaterialRef}
          map={hazeTexture}
          color="#d5e6e9"
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <mesh position={[0, 3.5, -170]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={31}>
        <planeGeometry args={[130, 430]} />
        <meshBasicMaterial
          ref={roadHazeMaterialRef}
          map={hazeTexture}
          color="#d5e6e9"
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default function FirstRoadBakedScene({ getLightingProfile }) {
  return (
    <group>
      <MountainCards getLightingProfile={getLightingProfile} />
      <BakedTerrain getLightingProfile={getLightingProfile} />
      <BakedRoad getLightingProfile={getLightingProfile} />
      <BakedAtmosphere getLightingProfile={getLightingProfile} />
    </group>
  );
}
