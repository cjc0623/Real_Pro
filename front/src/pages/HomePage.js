import React, { useEffect, useState, Suspense, useRef, useMemo } from "react";
import { Box } from "@mui/material"; 
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; 
import axios from 'axios';
import * as THREE from 'three';

import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ScrollControls, Scroll, useScroll, Html } from '@react-three/drei';

import ProcessSection from '../components/ProcessSection';
import InfoSection from '../components/InfoSection';
import QASection from '../components/QASection';
import damasImg from '../assets/damas.png'; 
import bikeImg from '../assets/bike.png'; 
import topTruckImg from '../assets/toptruck.png';
import wingImg from '../assets/wing.png';
import jangImg from '../assets/jangkkuktruck.png';
import liftImg from '../assets/lift.png';
import iceTruckImg from '../assets/icetruck.png';
import { API_SERVER_HOST } from "../api/serverConfig";
import MainFeesUtil from "../layout/component/common/MainFeesUtil";
import { postSearchFeesBasic } from "../api/estimateApi/estimateApi";
import { getNotices } from "../api/noticeApi";

// 트럭 렌더링 및 스크롤 후반부 빛줄기 변환 로직 통합
function TruckAndLightStreak() {
  const { scene } = useGLTF('/truck.glb');
  const scroll = useScroll();
  const truckRef = useRef();
  const streakRef = useRef();

  useFrame(() => {
    const p = scroll.offset;
    if (p < 0.7) {
      truckRef.current.visible = true;
      streakRef.current.visible = false;
    } else {
      truckRef.current.visible = false;
      streakRef.current.visible = true;
      const streakProgress = (p - 0.7) / 0.3;
      streakRef.current.scale.z = 1 + streakProgress * 30;
      streakRef.current.position.z = -streakProgress * 150;
    }
  });

  return (
    <group position={[0, 1.2, 0]}>
      <group ref={truckRef}>
        <primitive object={scene} scale={8.0} rotation={[0, Math.PI / 2, 0]} />
      </group>
      <group ref={streakRef} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 10, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <pointLight color="#aee0f2" intensity={800} distance={300} decay={2} />
      </group>
    </group>
  );
}

// 스크롤 구간별 표지판 등장 및 투명도 제어
function HighwaySign({ text, subText, scrollStart, scrollEnd }) {
  const groupRef = useRef();
  const divRef = useRef();
  const scroll = useScroll();

  useFrame(() => {
    const p = scroll.offset;
    if (p >= scrollStart && p <= scrollEnd) {
      const progress = (p - scrollStart) / (scrollEnd - scrollStart);
      groupRef.current.position.z = THREE.MathUtils.lerp(-150, 10, progress);
      const scale = THREE.MathUtils.lerp(0.8, 5.0, progress);
      groupRef.current.scale.setScalar(scale);
      
      if (divRef.current) {
        divRef.current.style.opacity = 1;
        divRef.current.style.visibility = 'visible';
      }
    } else {
      if (divRef.current) {
        divRef.current.style.opacity = 0;
        divRef.current.style.visibility = 'hidden';
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 8, -150]}>
      <Html transform center zIndexRange={[100, 0]}>
        <div ref={divRef} style={{ opacity: 0, visibility: 'hidden', transition: 'opacity 0.2s', background: 'rgba(5, 5, 10, 0.9)', border: '2px solid #ff1a1a', padding: '40px 60px', color: 'white', textAlign: 'center', borderRadius: '20px', width: '700px', pointerEvents: 'none', boxShadow: '0 0 30px rgba(255, 26, 26, 0.3)' }}>
          <h1 style={{ fontSize: '4.5rem', fontWeight: '900', margin: '0 0 10px 0' }}>{text}</h1>
          <p style={{ fontSize: '2rem', margin: 0, color: '#ccc' }}>{subText}</p>
        </div>
      </Html>
    </group>
  );
}

// 산맥 블록 단위 무한 스크롤 처리
function TerrainChunk({ zOffset, terrainGeo, terrainMatRef }) {
  const ref = useRef();
  const scroll = useScroll();

  useFrame((state, delta) => {
    const p = scroll.offset;
    const speed = p < 0.7 ? 60 : 150; 
    
    ref.current.position.z += delta * speed;
    if (ref.current.position.z > 400) {
      ref.current.position.z -= 800;
    }
  });

  return (
    <mesh ref={ref} geometry={terrainGeo} position={[0, -1.2, zOffset]}>
      <meshStandardMaterial ref={terrainMatRef} roughness={0.9} flatShading={true} />
    </mesh>
  );
}

// 산맥 침범 해결 및 배경 환경 렌더링
function MovingLandscape() {
  const scroll = useScroll();
  const linesRef = useRef();
  const lightsRef = useRef();
  const terrainMatRef = useRef();

  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(400, 400, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.abs(x);
      // 도로 침범 방지를 위해 평탄화 구간을 26으로 대폭 확장
      if (dist > 26) {
         const y = (dist - 26) * 0.8 + Math.sin(x * 0.15) * 6 + Math.cos(z * 0.1) * 10;
         pos.setY(i, y);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state, delta) => {
    const p = scroll.offset;
    const speed = p < 0.7 ? 60 : 150; 

    const nightTerrain = new THREE.Color('#030406');
    const dawnTerrain = new THREE.Color('#3a2311'); 
    const dayTerrain = new THREE.Color('#142b1e'); 
    let tColor = new THREE.Color();
    if (p < 0.5) tColor.lerpColors(nightTerrain, dawnTerrain, p * 2);
    else tColor.lerpColors(dawnTerrain, dayTerrain, (p - 0.5) * 2);
    if (terrainMatRef.current) terrainMatRef.current.color.copy(tColor);

    if (linesRef.current) {
      linesRef.current.children.forEach((line) => {
        line.position.z += delta * speed;
        if (line.position.z > 10) line.position.z -= 200;
      });
    }

    if (lightsRef.current) {
      lightsRef.current.children.forEach((light) => {
        light.position.z += delta * speed;
        if (light.position.z > 40) light.position.z -= 480;
      });
    }
  });

  return (
    <group>
      <TerrainChunk zOffset={0} terrainGeo={terrainGeo} terrainMatRef={terrainMatRef} />
      <TerrainChunk zOffset={-400} terrainGeo={terrainGeo} terrainMatRef={terrainMatRef} />

      <mesh position={[0, -1.1, -100]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[44, 600]} />
        <meshStandardMaterial color="#141414" roughness={0.8} />
      </mesh>

      <mesh position={[-20, -1.09, -100]} rotation={[-Math.PI / 2, 0, 0]}>
         <planeGeometry args={[0.3, 600]} />
         <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>
      
      <mesh position={[20, -1.09, -100]} rotation={[-Math.PI / 2, 0, 0]}>
         <planeGeometry args={[0.3, 600]} />
         <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>

      <group ref={linesRef}>
        {Array.from({ length: 20 }).map((_, i) => (
          <group key={i} position={[0, -1.09, -i * 10]}>
            <mesh position={[-6.6, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.3, 4]} />
              <meshBasicMaterial color="#ffffff" opacity={0.6} transparent />
            </mesh>
            <mesh position={[6.6, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.3, 4]} />
              <meshBasicMaterial color="#ffffff" opacity={0.6} transparent />
            </mesh>
          </group>
        ))}
      </group>

      <group ref={lightsRef}>
        {Array.from({ length: 6 }).map((_, i) => (
          <group key={`right-${i}`} position={[22, -1.1, -i * 80]}>
            <mesh position={[0, 9, 0]}>
              <cylinderGeometry args={[0.15, 0.25, 18, 16]} />
              <meshStandardMaterial color="#333" roughness={0.5} metalness={0.8} />
            </mesh>
            <mesh position={[-2.5, 17.8, 0]} rotation={[0, 0, Math.PI / 2.1]}>
              <cylinderGeometry args={[0.1, 0.15, 5, 16]} />
              <meshStandardMaterial color="#333" roughness={0.5} metalness={0.8} />
            </mesh>
            <mesh position={[-5, 17.6, 0]}>
              <boxGeometry args={[1.8, 0.15, 0.5]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[-5, 17.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.5, 0.4]} />
              <meshBasicMaterial color="#ffbd66" />
              <pointLight color="#ffbd66" intensity={250} distance={150} decay={2} />
            </mesh>
          </group>
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <group key={`left-${i}`} position={[-22, -1.1, -i * 80]}>
            <mesh position={[0, 9, 0]}>
              <cylinderGeometry args={[0.15, 0.25, 18, 16]} />
              <meshStandardMaterial color="#333" roughness={0.5} metalness={0.8} />
            </mesh>
            <mesh position={[2.5, 17.8, 0]} rotation={[0, 0, -Math.PI / 2.1]}>
              <cylinderGeometry args={[0.1, 0.15, 5, 16]} />
              <meshStandardMaterial color="#333" roughness={0.5} metalness={0.8} />
            </mesh>
            <mesh position={[5, 17.6, 0]}>
              <boxGeometry args={[1.8, 0.15, 0.5]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[5, 17.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.5, 0.4]} />
              <meshBasicMaterial color="#ffbd66" />
              <pointLight color="#ffbd66" intensity={250} distance={150} decay={2} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// 1인칭 단축 및 드론샷 확대를 통한 카메라 동선 재설계
function StorytellingLogic() {
  const scroll = useScroll(); 
  const lookAtTarget = new THREE.Vector3(0, 0, 0); 
  const cameraPos = new THREE.Vector3();
  
  const DRIVER_SEAT = new THREE.Vector3(0, 5.5, -2);
  
  const leftLightRef = useRef();
  const rightLightRef = useRef();

  useFrame((state) => {
    const p = scroll.offset; 

    const lightIntensity = p < 0.4 ? 200 : (p < 0.5 ? THREE.MathUtils.lerp(200, 0, (p - 0.4) * 10) : 0);
    if (leftLightRef.current) leftLightRef.current.intensity = lightIntensity;
    if (rightLightRef.current) rightLightRef.current.intensity = lightIntensity;

    if (p < 0.15) {
      const t = p / 0.15;
      cameraPos.lerpVectors(new THREE.Vector3(20, 14, 26), DRIVER_SEAT, t); 
      lookAtTarget.lerpVectors(new THREE.Vector3(0, 4, 0), new THREE.Vector3(0, 5.5, -50), t);
    } else if (p < 0.45) {
      cameraPos.copy(DRIVER_SEAT); 
      lookAtTarget.set(0, 5.5, -50);
    } else if (p < 0.55) {
      const t = (p - 0.45) / 0.10;
      cameraPos.lerpVectors(DRIVER_SEAT, new THREE.Vector3(0, 25, 25), t); 
      lookAtTarget.lerpVectors(new THREE.Vector3(0, 5.5, -50), new THREE.Vector3(0, 0, -20), t);
    } else if (p < 0.70) {
      cameraPos.set(0, 25, 25);
      lookAtTarget.set(0, 0, -20);
    } else if (p < 0.85) {
      const t = (p - 0.70) / 0.15;
      cameraPos.lerpVectors(new THREE.Vector3(0, 25, 25), new THREE.Vector3(0, 40, 10), t); 
      lookAtTarget.set(0, 0, -50);
    } else {
      const t = (p - 0.85) / 0.15;
      cameraPos.lerpVectors(new THREE.Vector3(0, 40, 10), new THREE.Vector3(-25, 15, 25), t); 
      lookAtTarget.set(0, 0, 0);
    }

    state.camera.position.copy(cameraPos);
    state.camera.lookAt(lookAtTarget);

    const nightSky = new THREE.Color('#030508');
    const dawnSky = new THREE.Color('#ff7e67'); 
    const daySky = new THREE.Color('#1c3328'); 
    let currentSky = new THREE.Color();
    
    if (p < 0.5) {
      currentSky.lerpColors(nightSky, dawnSky, p * 2);
    } else {
      currentSky.lerpColors(dawnSky, daySky, (p - 0.5) * 2);
    }
    
    state.scene.background = currentSky;
    state.scene.fog = new THREE.FogExp2(currentSky, 0.008); 
  });

  return (
    <>
      <MovingLandscape />
      
      <spotLight ref={leftLightRef} position={[-3, 3, -12]} target-position={[-3, 0, -200]} angle={0.4} penumbra={0.3} color="#ffffff" distance={300} />
      <spotLight ref={rightLightRef} position={[3, 3, -12]} target-position={[3, 0, -200]} angle={0.4} penumbra={0.3} color="#ffffff" distance={300} />
      
      <HighwaySign text="100% 매칭 시스템" subText="AI 최적화 경로로 딜레이 제로" scrollStart={0.20} scrollEnd={0.35} />
      <HighwaySign text="다양한 차종 지원" subText="오토바이 퀵부터 25톤 대형 트럭까지" scrollStart={0.50} scrollEnd={0.65} />
      <HighwaySign text="안전한 화물 운송" subText="실시간 트래킹으로 믿고 맡기세요" scrollStart={0.70} scrollEnd={0.85} />
    </>
  );
}

const initState = { startAddress: '', endAddress: '', cargoType: '', cargoWeight: '', totalCost: 0, distanceKm: '' };

const specialVehicleList = [
  { name: '탑차', img: topTruckImg, desc: '비/눈 방지 폐쇄형 적재함' },
  { name: '윙바디', img: wingImg, desc: '측면 개방 팔레트 상하차 용이' },
  { name: '장축', img: jangImg, desc: '표준보다 긴 적재함 탑재' },
  { name: '리프트', img: liftImg, desc: '파워게이트 장착 차량' },
  { name: '냉동차', img : iceTruckImg, desc: '신선식품 콜드체인 운송' }
];

const vehicleStaticList = [
  { name: '오토바이 퀵', desc1: '신속한 서류 배송 서비스', desc2: '교통체증 없는 빠른 배송', img: bikeImg },
  { name: '다마스 용달', desc1: '소형 화물 맞춤 서비스', desc2: '1인 가구 이사 적합', img: damasImg }
];

const HomePage = () => {
  const [estimate, setEstimate] = useState(initState);
  const [fees, setFees] = useState([]);
  const [notices, setNotices] = useState([]);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0); 
  const [openFees, setOpenFees] = useState(false);
  const [displayVehicles, setDisplayVehicles] = useState([]);

  const { roles, memberId } = useSelector(state => state.login || { roles: [], memberId: null });
  const isDriver = roles.includes("ROLE_DRIVER");
  const navigate = useNavigate();

  const DEFAULT_TRUCK_IMG = "/image/placeholders/truck.svg";

  const normalizeUrl = (p) => {
    if (!p) return null;
    const s = String(p).trim().replace(/\\/g, "/");
    if (s.startsWith('http')) return s;
    const base = API_SERVER_HOST.replace(/\/+$/, "");
    if (s.startsWith('/g2i4/uploads/')) return `${base}${s}`;
    if (s.startsWith('/uploads/')) return `${base}/g2i4${s}`; 
    return `${base}/g2i4/uploads/cargo/${encodeURIComponent(s)}`;
  };

  const fetchUnifiedVehicles = async () => {
    try {
      const feesRes = await postSearchFeesBasic();
      const feesData = Array.isArray(feesRes) ? feesRes : [];
      setFees(feesData);

      let cargoList = [];
      try {
        const res = await axios.get(`${API_SERVER_HOST}/g2i4/cargo/all/approved`);
        cargoList = res.data || [];
      } catch (e) {
        const res = await axios.get(`${API_SERVER_HOST}/g2i4/cargo/list/test2`);
        cargoList = (res.data || []).filter(c => c.status === 'APPROVED');
      }

      if (cargoList.length > 10) cargoList = cargoList.slice(cargoList.length - 10);

      if (cargoList.length > 0) {
        const combined = cargoList.map(c => {
          const cleanCapacity = String(c.cargoCapacity || "").replace(/[^0-9.]/g, "").trim();
          const feeMatch = feesData.find(f => String(f.weight || "").replace(/[^0-9.]/g, "").trim() === cleanCapacity);
          return {
            name: c.cargoName || c.cargoCapacity,
            desc1: `${c.cargoCapacity}급 전문 운송 서비스입니다.`,
            desc2: feeMatch ? `기본요금: ${Number(feeMatch.initialCharge).toLocaleString()}원 / km당: ${Number(feeMatch.ratePerKm).toLocaleString()}원` : "최적의 거리별 요금을 실시간으로 제공해드립니다.",
            img: normalizeUrl(c.cargoImage) || DEFAULT_TRUCK_IMG
          };
        });
        setDisplayVehicles(combined);
      } else {
        setDisplayVehicles(vehicleStaticList);
      }
    } catch (error) {
      console.error("데이터 로드 실패", error);
      setDisplayVehicles(vehicleStaticList);
    }
  };

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const res = await getNotices();
        setNotices(res.content || []);
      } catch (err) { console.error('공지 로드 실패', err); }
    };
    loadNotices();
    fetchUnifiedVehicles(); 
  }, [memberId]);

  return (
    <Box>
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#030508' }}>
        <Canvas camera={{ position: [20, 14, 26], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <Environment preset="city" />

          <ScrollControls pages={15} damping={0.15}>
            <Suspense fallback={null}>
              <TruckAndLightStreak />
            </Suspense>
            <StorytellingLogic />

            <Scroll html style={{ width: '100vw' }}>
              <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '10vw', color: 'white', pointerEvents: 'none', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                <h1 style={{ fontSize: '5.5rem', fontWeight: 'bold' }}>First Road</h1>
                <p style={{ fontSize: '2rem' }}>어둠을 뚫고, 가장 먼저 도달합니다.</p>
              </div>

              <div style={{ height: '1200vh' }} />

              <div style={{ height: '200vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#111', pointerEvents: 'none' }}>
                <h1 style={{ fontSize: '4.5rem', fontWeight: 'bold', textShadow: '0 4px 20px rgba(255,255,255,0.8)' }}>문 앞까지 완벽하게.</h1>
                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>퍼스트 로드의 여정은 고객의 미소에서 끝납니다.</p>
              </div>
            </Scroll>
          </ScrollControls>
        </Canvas>
      </div>

      <ProcessSection />
      <InfoSection />
      <QASection />

      <section className="py-24 bg-[#f8f9fb] font-sans text-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="w-full lg:w-1/3">
              <div className="mb-12">
                <h2 className="text-4xl md:text-5xl font-black mb-4">용달화물 서비스 소개</h2>
                <p className="text-gray-600 text-lg">마이페이지에서 등록한 모든 차량이 실시간으로 공유됩니다.</p>
              </div>

              <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto p-4 -m-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
                {displayVehicles.map((vehicle, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedVehicleIndex(index)}
                    className={`py-5 px-8 rounded-[2rem] flex justify-between items-center transition-all bg-white ${
                      selectedVehicleIndex === index ? 'ring-2 ring-red-600 scale-105 shadow-lg' : 'border border-gray-100 shadow-sm'
                    }`}
                  >
                    <span className="flex items-center gap-6">
                      <span className="font-bold text-xl">{index < 9 ? `0${index + 1}` : index + 1}</span>
                      <span className="text-xl font-bold">{vehicle.name}</span>
                    </span>
                    <span className="text-gray-400 text-2xl">〉</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-2/3 flex flex-col justify-start gap-12 mt-12 lg:mt-0"> 
              {displayVehicles[selectedVehicleIndex] && (
                <>
                  <div className="flex items-center gap-6 mb-8">
                    <span className="font-bold text-3xl text-red-600">0{selectedVehicleIndex + 1}</span>
                    <h3 className="text-4xl md:text-5xl font-black">{displayVehicles[selectedVehicleIndex].name}</h3>
                  </div>
                  <div className="flex-grow flex flex-col gap-8 mb-10">
                      <div className="text-gray-800 text-lg md:text-xl font-bold">{displayVehicles[selectedVehicleIndex].desc1}</div>
                      <div className="text-gray-600 text-base">{displayVehicles[selectedVehicleIndex].desc2}</div>
                  </div>
                  <div className="w-full flex justify-end">
                      <img 
                        src={displayVehicles[selectedVehicleIndex].img} 
                        alt={displayVehicles[selectedVehicleIndex].name}
                        onError={(e) => { e.target.src = DEFAULT_TRUCK_IMG; }}
                        className="w-full max-w-[600px] h-auto object-contain drop-shadow-2xl" 
                      />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 w-full">
            {specialVehicleList.map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-48 h-48 flex items-center justify-center mb-6 overflow-hidden">
                   <img src={item.img} alt={item.name} className="w-full h-auto object-contain hover:scale-105 transition-all" />
                </div>
                <h4 className="text-xl font-bold mb-3">{item.name}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MainFeesUtil 
        open={openFees} 
        onClose={() => setOpenFees(false)} 
        onSuccess={() => { fetchUnifiedVehicles(); setOpenFees(false); }} 
      />
    </Box>
  );
};

export default HomePage;