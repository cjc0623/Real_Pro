import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { clamp01, smoothstep } from "./firstRoadMath";
import { useFirstRoadScroll } from "./FirstRoadScrollContext.jsx";

export default function FirstRoadTransition() {
  const scroll = useFirstRoadScroll();
  const refs = useRef({ film: null, copy: null, cinema: null });

  useEffect(() => {
    refs.current.film = document.querySelector("#first-road-white-film");
    refs.current.copy = document.querySelector("#first-road-white-film .arrival-film-copy");
    refs.current.cinema = document.querySelector(".first-road-cinema");
  }, []);

  useFrame(() => {
    const p = scroll.offset;
    const enter = smoothstep(0.815, 0.875, p);
    const solid = smoothstep(0.855, 0.905, p);
    const opacity = clamp01(Math.max(enter * 0.94, solid));
    const content = smoothstep(0.895, 0.93, p);
    const beamWidth = THREE.MathUtils.lerp(16, 190, enter);
    const morningGlow = smoothstep(0.94, 1, p);

    if (refs.current.film) {
      refs.current.film.style.opacity = String(opacity);
      refs.current.film.style.visibility = opacity > 0.01 ? "visible" : "hidden";
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
  });

  return null;
}
