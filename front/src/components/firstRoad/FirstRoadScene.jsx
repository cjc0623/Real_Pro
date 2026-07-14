import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

import FirstRoadCameraRig from "./FirstRoadCameraRig.jsx";
import { getLightingProfile, smoothstep } from "./firstRoadMath";
import { useFirstRoadScroll } from "./FirstRoadScrollContext.jsx";

function SceneLighting({ ambientRef, sunRef, hemiRef }) {
  const scroll = useFirstRoadScroll();
  const { scene } = useThree();

  useFrame(() => {
    const p = scroll.offset;
    const profile = getLightingProfile(p);

    if (ambientRef.current) ambientRef.current.intensity = profile.ambient;

    if (sunRef.current) {
      sunRef.current.intensity = profile.sun;
      sunRef.current.color.lerpColors(
        new THREE.Color("#8fa7c8"),
        new THREE.Color("#fff0c6"),
        smoothstep(0.68, 1, p)
      );
    }

    if (hemiRef.current) {
      const natural = smoothstep(0.58, 1, p);
      hemiRef.current.intensity = THREE.MathUtils.lerp(0.02, 1.05, natural);
      hemiRef.current.color.lerpColors(new THREE.Color("#253746"), new THREE.Color("#c9edf2"), natural);
      hemiRef.current.groundColor.lerpColors(new THREE.Color("#050806"), new THREE.Color("#6f8a68"), natural);
    }

    const sky = new THREE.Color();
    if (profile.phase < 0.34) {
      sky.lerpColors(new THREE.Color("#020306"), new THREE.Color("#263447"), profile.phase / 0.34);
    } else if (profile.phase < 0.72) {
      sky.lerpColors(new THREE.Color("#263447"), new THREE.Color("#9aa7b2"), (profile.phase - 0.34) / 0.38);
    } else {
      sky.lerpColors(new THREE.Color("#9aa7b2"), new THREE.Color("#f1d2a6"), (profile.phase - 0.72) / 0.28);
    }

    scene.background = null;
    scene.fog = new THREE.FogExp2(sky, Math.max(0.00055, profile.fogDensity * 0.55));
  });

  return null;
}

function AtmosphereGrade() {
  const scroll = useFirstRoadScroll();
  const { pointer } = useThree();
  const ref = useRef(null);
  const cinemaRef = useRef(null);
  const parallaxRef = useRef(new THREE.Vector2());

  useEffect(() => {
    ref.current = document.querySelector(".first-road-atmosphere-grade");
    cinemaRef.current = document.querySelector(".first-road-cinema");
  }, []);

  useFrame(() => {
    if (!ref.current) return;

    const p = scroll.offset;
    const profile = getLightingProfile(p);
    const dawn = smoothstep(0.48, 0.76, p) * (1 - smoothstep(0.86, 0.94, p));
    const morning = smoothstep(0.94, 1.0, p);
    const night = 1 - smoothstep(0.22, 0.48, p);
    const opacity = Math.min(1, Math.max(0, dawn * 0.24 + morning * 0.25 + night * 0.1));
    const reveal = smoothstep(0.28, 0.92, p);

    parallaxRef.current.x = THREE.MathUtils.lerp(parallaxRef.current.x, pointer.x, 0.045);
    parallaxRef.current.y = THREE.MathUtils.lerp(parallaxRef.current.y, pointer.y, 0.045);

    ref.current.style.setProperty("--night", String(night));
    ref.current.style.setProperty("--dawn", String(dawn));
    ref.current.style.setProperty("--morning", String(morning));
    ref.current.style.opacity = String(opacity);

    if (cinemaRef.current) {
      const driftX = THREE.MathUtils.lerp(-16, 12, smoothstep(0.08, 0.9, p)) + parallaxRef.current.x * 14;
      const driftY = THREE.MathUtils.lerp(-10, 6, smoothstep(0.34, 1, p)) - parallaxRef.current.y * 6;
      const scale = THREE.MathUtils.lerp(1.16, 1.05, reveal);
      const dim = THREE.MathUtils.lerp(0.42, 0, reveal) + night * 0.04;
      const warm = smoothstep(0.72, 1, profile.phase);

      cinemaRef.current.style.setProperty("--backdrop-x", `${driftX}px`);
      cinemaRef.current.style.setProperty("--backdrop-y", `${driftY}px`);
      cinemaRef.current.style.setProperty("--backdrop-scale", String(scale));
      cinemaRef.current.style.setProperty("--backdrop-dim", String(Math.min(0.52, Math.max(0, dim))));
      cinemaRef.current.style.setProperty("--backdrop-warm", String(warm));
      cinemaRef.current.style.setProperty("--route-progress", String(reveal));
      cinemaRef.current.style.setProperty("--route-night", String(night));
      cinemaRef.current.style.setProperty("--route-dawn", String(dawn));
      cinemaRef.current.style.setProperty("--route-morning", String(morning));
      cinemaRef.current.style.setProperty(
        "--valley-fog-opacity",
        String(0.018 + smoothstep(0.25, 0.62, p) * 0.09 - smoothstep(0.76, 0.96, p) * 0.08)
      );
      cinemaRef.current.style.setProperty("--valley-fog-x", `${THREE.MathUtils.lerp(-7, 8, p) + parallaxRef.current.x * 5}vw`);
      cinemaRef.current.style.setProperty("--valley-fog-y", `${THREE.MathUtils.lerp(3, -2, reveal)}vh`);
      cinemaRef.current.style.setProperty("--valley-fog-warm", String(warm));
    }
  });

  return null;
}

function WhiteFilmController() {
  const scroll = useFirstRoadScroll();
  const refs = useRef({ film: null, copy: null, cinema: null, outro: null });

  useEffect(() => {
    refs.current.film = document.querySelector("#first-road-white-film");
    refs.current.copy = document.querySelector("#first-road-white-film .arrival-film-copy");
    refs.current.cinema = document.querySelector(".first-road-cinema");
    refs.current.outro = document.querySelector("#first-road-outro");

    return () => {
      document.body.classList.remove("first-road-outro-active");
      refs.current.outro?.classList.remove("is-active");
    };
  }, []);

  useFrame(() => {
    const p = scroll.offset;
    const outroP = scroll.outroOffset;
    const enter = smoothstep(0.845, 0.91, p);
    const solid = smoothstep(0.895, 0.945, p);
    const opacity = Math.min(1, Math.max(0, enter * 0.58 + solid * 0.88));
    const content = smoothstep(0.91, 0.95, p);
    const beamWidth = THREE.MathUtils.lerp(10, 92, enter);
    const morningGlow = smoothstep(0.94, 1, p) * 0.35;
    const outroReveal = smoothstep(0.02, 0.18, outroP);
    const outroSettle = smoothstep(0.12, 0.38, outroP);
    const outroDiamond = smoothstep(0.42, 0.72, outroP);
    const outroFinal = smoothstep(0.72, 0.96, outroP);
    const settledScale = THREE.MathUtils.lerp(1.06, 1, outroSettle);
    const outroScale = THREE.MathUtils.lerp(settledScale, 0.29, outroDiamond);
    const outroBlur = THREE.MathUtils.lerp(13, 0, outroSettle);
    const outroCopyOpacity = outroSettle * (1 - outroFinal);
    const filmOpacity = opacity * (1 - outroReveal);
    document.body.classList.toggle("first-road-outro-active", outroReveal > 0.05);
    refs.current.outro?.classList.toggle("is-active", outroReveal > 0.05);

    if (refs.current.film) {
      refs.current.film.style.opacity = String(filmOpacity);
      refs.current.film.style.visibility = filmOpacity > 0.01 ? "visible" : "hidden";
      refs.current.film.style.setProperty("--beam-width", `${beamWidth}vw`);
      refs.current.film.style.setProperty("--white-solid", String(solid));
    }

    if (refs.current.copy) {
      refs.current.copy.style.opacity = String(content);
      refs.current.copy.style.transform = `translateY(${THREE.MathUtils.lerp(28, 0, content)}px)`;
    }

    if (refs.current.cinema) {
      refs.current.cinema.style.setProperty("--morning-glow", String(morningGlow));
    }

    if (refs.current.outro) {
      refs.current.outro.style.opacity = String(outroReveal);
      refs.current.outro.style.visibility = outroReveal > 0.01 ? "visible" : "hidden";
      refs.current.outro.style.setProperty("--outro-reveal", String(outroReveal));
      refs.current.outro.style.setProperty("--outro-settle", String(outroSettle));
      refs.current.outro.style.setProperty("--outro-progress", String(outroSettle));
      refs.current.outro.style.setProperty("--outro-diamond", String(outroDiamond));
      refs.current.outro.style.setProperty("--outro-final", String(outroFinal));
      refs.current.outro.style.setProperty("--outro-scene-scale", String(outroScale));
      refs.current.outro.style.setProperty("--outro-scene-y", `${THREE.MathUtils.lerp(0, -15, outroDiamond)}vh`);
      refs.current.outro.style.setProperty("--outro-blur", `${outroBlur}px`);
      refs.current.outro.style.setProperty("--outro-inset", `${outroDiamond * 50}%`);
      refs.current.outro.style.setProperty("--outro-copy-opacity", String(outroCopyOpacity));
    }
  });

  return null;
}

export default function FirstRoadScene() {
  const ambientRef = useRef();
  const sunRef = useRef();
  const hemiRef = useRef();

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.08} />
      <hemisphereLight ref={hemiRef} skyColor="#253746" groundColor="#050806" intensity={0.02} />
      <directionalLight ref={sunRef} position={[-32, 26, -44]} intensity={0.03} color="#8fa7c8" />

      <FirstRoadCameraRig />
      <SceneLighting ambientRef={ambientRef} sunRef={sunRef} hemiRef={hemiRef} />
      <AtmosphereGrade />
      <WhiteFilmController />
    </>
  );
}
