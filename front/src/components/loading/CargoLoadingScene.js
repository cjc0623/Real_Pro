import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";

function RotatingBox() {
  const { scene } = useGLTF("/models/box.glb");
  const ref = useRef();

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.015;
    ref.current.rotation.x += 0.004;
  });

  return <primitive ref={ref} object={scene} scale={2} position={[0, 0, 0]} />;
}

export default function CargoLoadingScene({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 400);
          return 100;
        }
        return prev + 1;
      });
    }, 35);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 9999,
      }}
    >
      <Canvas camera={{ position: [0, 1.5, 20], fov: 45 }}>
        <color attach="background" args={["#000"]} />

        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 4]} intensity={2} />
        <pointLight position={[0, 2, 3]} intensity={3} color="#ffcc66" />

        <Environment preset="warehouse" />

        <RotatingBox />
      </Canvas>

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "80px",
          transform: "translateX(-50%)",
          color: "#fff",
          fontSize: "42px",
          fontWeight: 300,
          letterSpacing: "-1px",
        }}
      >
        {progress}%
      </div>
    </div>
  );
}

useGLTF.preload("/models/box.glb");