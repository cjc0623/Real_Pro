import { useEffect, useState } from "react";

export default function CargoLoadingScene({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 300);
          return 100;
        }

        return prev + 2;
      });
    }, 24);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at 50% 38%, rgba(229,36,36,0.16), transparent 34%), linear-gradient(135deg, #05080d 0%, #101722 55%, #05080d 100%)",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "min(420px, 70vw)",
          textAlign: "center",
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            margin: "0 auto 34px",
            width: "112px",
            height: "74px",
            borderRadius: "12px",
            background: "linear-gradient(145deg, #f3f0e8, #b9a77c)",
            boxShadow: "0 34px 90px rgba(0,0,0,0.38), inset -18px -16px 34px rgba(78,58,25,0.22)",
            transform: `translateY(${Math.sin(progress / 12) * 5}px) rotateX(12deg) rotateY(-18deg)`,
            transition: "transform 120ms linear",
          }}
        >
          <div
            style={{
              height: "12px",
              margin: "0 auto",
              width: "44px",
              background: "rgba(110,82,38,0.28)",
              borderRadius: "0 0 8px 8px",
            }}
          />
        </div>

        <div
          style={{
            height: "4px",
            overflow: "hidden",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.14)",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: "999px",
              background: "#e52424",
              transition: "width 80ms linear",
            }}
          />
        </div>

        <div
          style={{
            marginTop: "22px",
            fontSize: "38px",
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          {progress}%
        </div>
      </div>
    </div>
  );
}
