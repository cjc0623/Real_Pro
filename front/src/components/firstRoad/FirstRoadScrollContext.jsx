import React, { createContext, useContext, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const FirstRoadScrollContext = createContext(null);

export const FIRST_ROAD_SCENE_SHARE = 0.82;

export function splitFirstRoadProgress(pageOffset) {
  const clampedPageOffset = Math.min(1, Math.max(0, pageOffset));

  return {
    sceneOffset: Math.min(1, clampedPageOffset / FIRST_ROAD_SCENE_SHARE),
    outroOffset: Math.min(
      1,
      Math.max(0, (clampedPageOffset - FIRST_ROAD_SCENE_SHARE) / (1 - FIRST_ROAD_SCENE_SHARE))
    ),
  };
}

function findScrollContainer(element) {
  let parent = element?.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = `${style.overflowY} ${style.overflow}`;
    const canScroll = /(auto|scroll|overlay)/.test(overflowY);

    if (canScroll && parent.scrollHeight > parent.clientHeight + 1) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return window;
}

export function getFirstRoadScrollTargets(hero) {
  const scrollContainer = hero ? findScrollContainer(hero) : window;
  return scrollContainer === window ? [window] : [window, scrollContainer];
}

export function getFirstRoadScrollMetrics(hero) {
  if (!hero) return null;

  const scrollContainer = findScrollContainer(hero);
  const rect = hero.getBoundingClientRect();

  if (scrollContainer === window) {
    const scrollDistance = Math.max(1, rect.height - window.innerHeight);

    return {
      scrollContainer,
      rawOffset: -rect.top / scrollDistance,
    };
  }

  const containerRect = scrollContainer.getBoundingClientRect();
  const scrollDistance = Math.max(1, rect.height - containerRect.height);

  return {
    scrollContainer,
    rawOffset: (containerRect.top - rect.top) / scrollDistance,
  };
}

export function FirstRoadScrollProvider({ children, heroRef }) {
  const scrollState = useRef({
    offset: 0,
    sceneOffset: 0,
    outroOffset: 0,
    pageOffset: 0,
    delta: 0,
    rawOffset: 0,
  });
  const previousOffset = useRef(0);

  const updateScroll = () => {
    const hero = heroRef.current;
    if (!hero) return;

    const metrics = getFirstRoadScrollMetrics(hero);
    if (!metrics) return;

    const { rawOffset } = metrics;
    const pageOffset = Math.min(1, Math.max(0, rawOffset));
    const { sceneOffset, outroOffset } = splitFirstRoadProgress(pageOffset);

    scrollState.current.delta = Math.abs(sceneOffset - previousOffset.current);
    scrollState.current.offset = sceneOffset;
    scrollState.current.sceneOffset = sceneOffset;
    scrollState.current.outroOffset = outroOffset;
    scrollState.current.pageOffset = pageOffset;
    scrollState.current.rawOffset = rawOffset;
    previousOffset.current = sceneOffset;
  };

  useEffect(() => {
    const scrollTargets = getFirstRoadScrollTargets(heroRef.current);

    updateScroll();
    scrollTargets.forEach((target) => {
      target.addEventListener("scroll", updateScroll, { passive: true });
    });
    window.addEventListener("resize", updateScroll);

    return () => {
      scrollTargets.forEach((target) => {
        target.removeEventListener("scroll", updateScroll);
      });
      window.removeEventListener("resize", updateScroll);
    };
  }, []);

  useFrame(updateScroll);

  return (
    <FirstRoadScrollContext.Provider value={scrollState.current}>
      {children}
    </FirstRoadScrollContext.Provider>
  );
}

export function useFirstRoadScroll() {
  const scroll = useContext(FirstRoadScrollContext);

  if (!scroll) {
    throw new Error("useFirstRoadScroll must be used inside FirstRoadScrollProvider.");
  }

  return scroll;
}
