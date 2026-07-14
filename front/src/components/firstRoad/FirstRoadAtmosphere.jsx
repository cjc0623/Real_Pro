import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

import { clamp01, getLightingProfile, smoothstep } from "./firstRoadMath";
import { useFirstRoadScroll } from "./FirstRoadScrollContext.jsx";

export function FirstRoadLighting({ ambientRef, sunRef, hemiRef }) {
  const scroll = useFirstRoadScroll();
  const { scene } = useThree();

  useFrame(() => {
    const p = scroll.offset;
    const profile = getLightingProfile(p);

    if (ambientRef.current) ambientRef.current.intensity = profile.ambient;

    if (sunRef.current) {
      sunRef.current.intensity = profile.sun;
      sunRef.current.color.lerpColors(new THREE.Color("#8fa7c8"), new THREE.Color("#fff0c6"), smoothstep(0.68, 1, p));
    }

    if (hemiRef.current) {
      const natural = smoothstep(0.58, 1, p);
      hemiRef.current.intensity = THREE.MathUtils.lerp(0.02, 1.05, natural);
      hemiRef.current.color.lerpColors(new THREE.Color("#253746"), new THREE.Color("#c9edf2"), natural);
      hemiRef.current.groundColor.lerpColors(new THREE.Color("#050806"), new THREE.Color("#6f8a68"), natural);
    }

    const sky = new THREE.Color();
    if (profile.phase < 0.34) {
      sky.lerpColors(new THREE.Color("#020306"), new THREE.Color("#1c2a3a"), profile.phase / 0.34);
    } else if (profile.phase < 0.72) {
      sky.lerpColors(new THREE.Color("#1c2a3a"), new THREE.Color("#9eb2bc"), (profile.phase - 0.34) / 0.38);
    } else {
      sky.lerpColors(new THREE.Color("#9eb2bc"), new THREE.Color("#f1d2a6"), (profile.phase - 0.72) / 0.28);
    }

    scene.background = sky;
    scene.fog = new THREE.FogExp2(sky, Math.max(0.0022, profile.fogDensity));
  });

  return null;
}

export function FirstRoadGrade() {
  const scroll = useFirstRoadScroll();
  const ref = useRef();

  React.useEffect(() => {
    ref.current = document.querySelector(".first-road-atmosphere-grade");
  }, []);

  useFrame(() => {
    if (!ref.current) return;

    const p = scroll.offset;
    const dawn = smoothstep(0.48, 0.76, p) * (1 - smoothstep(0.86, 0.94, p));
    const morning = smoothstep(0.94, 1.0, p);
    const night = 1 - smoothstep(0.22, 0.48, p);

    ref.current.style.setProperty("--night", String(night));
    ref.current.style.setProperty("--dawn", String(dawn));
    ref.current.style.setProperty("--morning", String(morning));
    ref.current.style.opacity = String(clamp01(dawn * 0.72 + morning * 0.76 + night * 0.2));
  });

  return null;
}
