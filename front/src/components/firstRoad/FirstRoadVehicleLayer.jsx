import React, { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

import {
  createRandom,
  FIRST_ROAD_TRUCK_ANCHOR,
  getLightingProfile,
  makeCanvasTexture,
} from "./firstRoadMath";
import { useFirstRoadScroll } from "./FirstRoadScrollContext.jsx";

const TRUCK_MODEL_URL = "/truck-animated-v1.glb";
const TRUCK_SCENE_LENGTH = 9.4;
const TRUCK_LABEL_SCALE = TRUCK_SCENE_LENGTH / 5.6;

function isWheelAxleNode(object) {
  return object.children?.some((child) => /^wheels_Circle/i.test(child.name));
}

function createTruckLabelTexture() {
  const texture = makeCanvasTexture(1024, 256, (ctx, width, height) => {
    const random = createRandom(147);
    ctx.clearRect(0, 0, width, height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 126px Arial, sans-serif";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(91, 19, 17, 0.46)";
    ctx.strokeText("First Road", width / 2, height / 2 + 4);
    ctx.fillStyle = "#b92320";
    ctx.fillText("First Road", width / 2, height / 2 + 4);

    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 380; i += 1) {
      const alpha = 0.08 + random() * 0.2;
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(random() * width, random() * height, 1 + random() * 4, 1 + random() * 2);
    }
    ctx.globalCompositeOperation = "source-over";
  });

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function createTruckShadowTexture() {
  return makeCanvasTexture(512, 256, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.08,
      width / 2,
      height / 2,
      width * 0.48
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0.42)");
    gradient.addColorStop(0.48, "rgba(0, 0, 0, 0.2)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });
}

function softenTruckMaterial(material) {
  const softened = material.clone();

  if (softened.isMeshStandardMaterial || softened.isMeshPhysicalMaterial) {
    if (softened.color) {
      softened.color.lerp(new THREE.Color("#a8aaa0"), 0.18);
      softened.color.multiplyScalar(1.04);
    }

    softened.transparent = false;
    softened.opacity = 1;
    softened.depthWrite = true;
    softened.depthTest = true;
    softened.side = THREE.FrontSide;
    softened.metalness = Math.min(softened.metalness ?? 0, 0.18);
    softened.roughness = Math.max(softened.roughness ?? 1, 0.68);
    softened.envMapIntensity = Math.max(Math.min(softened.envMapIntensity ?? 1, 0.34), 0.18);
    if (softened.emissive) {
      softened.emissive.lerp(new THREE.Color("#191711"), 0.22);
      softened.emissiveIntensity = Math.max(softened.emissiveIntensity ?? 0, 0.065);
    }

    if (softened.clearcoat !== undefined) softened.clearcoat = Math.min(softened.clearcoat, 0.06);
    if (softened.clearcoatRoughness !== undefined) {
      softened.clearcoatRoughness = Math.max(softened.clearcoatRoughness, 0.66);
    }
  }

  return softened;
}

class TruckErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

function TruckGLB() {
  const animationRootRef = useRef();
  const scroll = useFirstRoadScroll();
  const { scene } = useGLTF(TRUCK_MODEL_URL);
  const truck = useMemo(() => {
    const clonedTruck = scene.clone(true);

    clonedTruck.traverse((object) => {
      if (!object.isMesh || !object.material) return;

      object.material = Array.isArray(object.material)
        ? object.material.map(softenTruckMaterial)
        : softenTruckMaterial(object.material);
    });

    return clonedTruck;
  }, [scene]);
  const wheelAxles = useMemo(() => {
    const axles = [];

    truck.traverse((object) => {
      if (isWheelAxleNode(object)) axles.push(object);
    });

    return axles;
  }, [truck]);
  const labelTexture = useMemo(() => createTruckLabelTexture(), []);
  const fit = useMemo(() => {
    truck.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(truck);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const horizontalLength = Math.max(size.x, size.z, 0.0001);
    const scale = TRUCK_SCENE_LENGTH / horizontalLength;

    return {
      scale,
      position: [-center.x * scale, -bounds.min.y * scale, -center.z * scale],
    };
  }, [truck]);

  useFrame((_, delta) => {
    const profile = getLightingProfile(scroll.offset);
    const wheelSpeed = THREE.MathUtils.lerp(
      9,
      15,
      Math.min(1, (profile.foregroundSpeed || 56) / 92)
    );

    wheelAxles.forEach((axle) => {
      axle.rotateX(delta * wheelSpeed);
    });
  });

  return (
    <group ref={animationRootRef}>
      <primitive object={truck} scale={fit.scale} position={fit.position} />

      {[-1, 1].map((side) => (
        <mesh
          key={`truck-label-${side}`}
          position={[
            side * 0.61 * TRUCK_LABEL_SCALE,
            1.18 * TRUCK_LABEL_SCALE,
            -0.95 * TRUCK_LABEL_SCALE,
          ]}
          rotation={[0, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          renderOrder={18}
        >
          <planeGeometry args={[2.35 * TRUCK_LABEL_SCALE, 0.48 * TRUCK_LABEL_SCALE]} />
          <meshStandardMaterial
            map={labelTexture}
            transparent
            alphaTest={0.08}
            roughness={0.92}
            metalness={0}
            depthWrite
            depthTest
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
      ))}
    </group>
  );
}

function Truck3D() {
  const scroll = useFirstRoadScroll();
  const groupRef = useRef();
  const truckVisualRef = useRef();
  const shadowTexture = useMemo(() => createTruckShadowTexture(), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const p = scroll.offset;
    groupRef.current.position.set(
      FIRST_ROAD_TRUCK_ANCHOR.x,
      FIRST_ROAD_TRUCK_ANCHOR.y + Math.sin(clock.elapsedTime * 8.2) * 0.008,
      FIRST_ROAD_TRUCK_ANCHOR.z
    );
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.7) * 0.0018;

    if (truckVisualRef.current) truckVisualRef.current.visible = false;
  });

  return (
    <group
      ref={groupRef}
      position={[FIRST_ROAD_TRUCK_ANCHOR.x, FIRST_ROAD_TRUCK_ANCHOR.y, FIRST_ROAD_TRUCK_ANCHOR.z]}
    >
      <pointLight position={[4.8, 4.2, 5.5]} intensity={10} distance={28} color="#ffe6b8" />
      <pointLight position={[-5.5, 2.6, -9]} intensity={3.2} distance={25} color="#8aa8c4" />
      <group ref={truckVisualRef} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.035, -0.2]} rotation={[-Math.PI / 2, 0, 0]} scale={[5.4, 9.2, 1]} renderOrder={5}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={shadowTexture} transparent opacity={0.72} depthWrite={false} />
        </mesh>
        <TruckErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <TruckGLB />
          </Suspense>
        </TruckErrorBoundary>
      </group>
    </group>
  );
}

export default function FirstRoadVehicleLayer() {
  return (
    <>
      <Truck3D />
    </>
  );
}

useGLTF.preload(TRUCK_MODEL_URL);
