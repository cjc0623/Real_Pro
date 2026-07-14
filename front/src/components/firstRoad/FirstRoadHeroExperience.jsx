import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";

import FirstRoadScene from "./FirstRoadScene.jsx";
import FirstRoadOutro from "./FirstRoadOutro.jsx";
import {
  FirstRoadScrollProvider,
  getFirstRoadScrollMetrics,
  splitFirstRoadProgress,
} from "./FirstRoadScrollContext.jsx";
import "./firstRoadHero.css";

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0, edge1, value) {
  const x = clamp01((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function HeroHtml({ heroRef }) {
  const copyLayerRef = useRef(null);

  useEffect(() => {
    let frameId = 0;

    const updateCopy = () => {
      const hero = heroRef.current;
      const copyLayer = copyLayerRef.current;
      if (!hero || !copyLayer) {
        frameId = window.requestAnimationFrame(updateCopy);
        return;
      }

      const metrics = getFirstRoadScrollMetrics(hero);
      if (!metrics) {
        frameId = window.requestAnimationFrame(updateCopy);
        return;
      }

      const pageProgress = clamp01(metrics.rawOffset);
      const { sceneOffset: progress } = splitFirstRoadProgress(pageProgress);

      copyLayer.querySelectorAll("[data-enter]").forEach((section) => {
        const enter = Number(section.dataset.enter);
        const hold = Number(section.dataset.hold);
        const exit = Number(section.dataset.exit);
        const fadeIn = smoothstep(enter, hold, progress);
        const fadeOut = 1 - smoothstep(exit - 0.04, exit, progress);
        const opacity = clamp01(fadeIn * fadeOut);

        section.style.opacity = String(opacity);
        section.style.transform = `translate3d(0, ${24 * (1 - opacity)}px, 0)`;
        section.style.visibility = opacity > 0.01 ? "visible" : "hidden";
      });

      frameId = window.requestAnimationFrame(updateCopy);
    };

    frameId = window.requestAnimationFrame(updateCopy);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [heroRef]);

  return (
    <div ref={copyLayerRef} className="first-road-copy-layer">
      <section className="cinema-copy cinema-copy-hero" data-enter="-0.01" data-hold="0.01" data-exit="0.14">
        <div>
          <p>FIRST ROAD LOGISTICS</p>
          <h1>First Road</h1>
          <span>&#50612;&#46176;&#51012; &#46763;&#44256;, &#44032;&#51109; &#47676;&#51200; &#46020;&#52265;&#54633;&#45768;&#45796;.</span>
        </div>
      </section>

      <section className="cinema-copy cinema-copy-left" data-enter="0.1" data-hold="0.13" data-exit="0.22">
        <div>
          <p>BEFORE SUNRISE</p>
          <h2>&#44032;&#51109; &#48736;&#47480; &#46020;&#52265;&#51008; &#44032;&#51109; &#51060;&#47480; &#52636;&#48156;&#50640;&#49436; &#49884;&#51089;&#46121;&#45768;&#45796;.</h2>
        </div>
      </section>

      <section className="cinema-copy cinema-copy-corner" data-enter="0.23" data-hold="0.27" data-exit="0.41">
        <div>
          <p>Night Route Control</p>
          <h2>&#50556;&#44036; &#50868;&#49569; &#52572;&#51201;&#54868;</h2>
          <span>&#49892;&#49884;&#44036; &#48176;&#52264;&#50752; &#44221;&#47196; &#44288;&#47532;&#47196; &#50612;&#46160;&#50868; &#49884;&#44036;&#50640;&#46020; &#50868;&#49569; &#55120;&#47492;&#51012; &#45459;&#52824;&#51648; &#50506;&#49845;&#45768;&#45796;.</span>
        </div>
      </section>

      <section className="cinema-copy cinema-copy-left" data-enter="0.44" data-hold="0.47" data-exit="0.56">
        <div>
          <p>LIVE VISIBILITY</p>
          <h2>&#47784;&#46304; &#51060;&#46041;&#51012; &#45459;&#52824;&#51648; &#50506;&#49845;&#45768;&#45796;.</h2>
          <span>&#52636;&#48156;&#48512;&#53552; &#46020;&#52265;&#44620;&#51648;, &#54868;&#47932;&#51032; &#50948;&#52824;&#50752; &#49345;&#53468;&#47484; &#54616;&#45208;&#51032; &#55120;&#47492;&#51004;&#47196; &#50672;&#44208;&#54633;&#45768;&#45796;.</span>
        </div>
      </section>

      <section className="cinema-copy cinema-copy-corner" data-enter="0.55" data-hold="0.59" data-exit="0.69">
        <div>
          <p>DAWN ROUTE</p>
          <h2>&#45130;&#44592;&#51648; &#50506;&#45716; &#50868;&#49569;&#51008; &#49352;&#48317;&#48372;&#45796; &#47676;&#51200; &#50880;&#51649;&#51077;&#45768;&#45796;.</h2>
        </div>
      </section>

      <section className="cinema-copy cinema-copy-left" data-enter="0.7" data-hold="0.74" data-exit="0.82">
        <div>
          <p>ROUTE CERTAINTY</p>
          <h2>&#48320;&#49688;&#48372;&#45796; &#47676;&#51200; &#44221;&#47196;&#47484; &#44208;&#51221;&#54633;&#45768;&#45796;.</h2>
          <span>&#49884;&#44036;, &#44144;&#47532;, &#46020;&#47196; &#49345;&#54889;&#51012; &#44228;&#49328;&#54644; &#44032;&#51109; &#54869;&#49892;&#54620; &#46020;&#52265;&#51012; &#47564;&#46317;&#45768;&#45796;.</span>
        </div>
      </section>

      <section className="cinema-copy cinema-copy-center" data-enter="0.82" data-hold="0.86" data-exit="0.94">
        <div>
          <h2>&#44032;&#51109; &#47676;&#51200; &#46020;&#52265;&#54616;&#45716; &#48652;&#47004;&#46300;.</h2>
          <span>&#49328;&#47589; &#49324;&#51060;&#51032; &#44600;&#51012; &#46384;&#46972;, First Road&#44032; &#46020;&#52265;&#51012; &#50756;&#49457;&#54633;&#45768;&#45796;.</span>
        </div>
      </section>
    </div>
  );
}

function BrandLoader() {
  const { progress } = useProgress();
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fallback = setTimeout(() => {
      setExiting(true);
      setTimeout(() => setDone(true), 680);
    }, 3200);

    if (progress >= 100) {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => setDone(true), 680);
      }, 650);

      return () => {
        clearTimeout(timer);
        clearTimeout(fallback);
      };
    }

    return () => clearTimeout(fallback);
  }, [progress]);

  if (done) return null;

  return (
    <div className={`first-road-loader ${exiting ? "is-exiting" : ""}`}>
      <div>
        <p>FIRST ROAD LOGISTICS</p>
        <h1>{Math.round(progress)}%</h1>
        <span>&#52395; &#48264;&#51704; &#44221;&#47196;&#47484; &#51456;&#48708; &#51473;&#51077;&#45768;&#45796;.</span>
      </div>
    </div>
  );
}

function CanvasFallback() {
  return null;
}

export default function FirstRoadHeroExperience({ onConsult }) {
  const heroRef = useRef(null);

  return (
    <div ref={heroRef} className="first-road-cinema">
      <div className="first-road-cinema-stage">
        <BrandLoader />
        <div className="first-road-matte-backdrop" />
        <div className="first-road-valley-fog" aria-hidden="true">
          <div className="first-road-fog first-road-fog-far" />
          <div className="first-road-fog first-road-fog-mid" />
          <div className="first-road-fog first-road-fog-near" />
        </div>
        <div className="first-road-atmosphere-grade" />

        <div id="first-road-white-film" className="first-road-white-film">
          <div className="arrival-film-copy">
            <p>ARRIVE FIRST. MOVE SMARTER.</p>
            <h2>&#47676;&#51200; &#52636;&#48156;&#54616;&#44256;, &#51221;&#54869;&#55176; &#46020;&#52265;&#54633;&#45768;&#45796;.</h2>
            <span>
              First Road&#45716; &#49892;&#49884;&#44036; &#48176;&#52264;, &#44221;&#47196; &#52572;&#51201;&#54868;, &#54868;&#47932; &#52628;&#51201;&#51012; &#54616;&#45208;&#51032; &#50868;&#49569; &#55120;&#47492;&#51004;&#47196; &#50672;&#44208;&#54633;&#45768;&#45796;.
            </span>
          </div>
        </div>

        <FirstRoadOutro onConsult={onConsult} />
        <HeroHtml heroRef={heroRef} />

        <Canvas
          key="first-road-cinematic-scene"
          camera={{ position: [7.4, 4.2, 18], fov: 44, near: 0.1, far: 900 }}
          dpr={[1, 1.7]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.setClearColor("#020306", 0);
          }}
        >
          <FirstRoadScrollProvider heroRef={heroRef}>
            <Suspense fallback={<CanvasFallback />}>
              <FirstRoadScene />
            </Suspense>
          </FirstRoadScrollProvider>
        </Canvas>
      </div>
    </div>
  );
}
