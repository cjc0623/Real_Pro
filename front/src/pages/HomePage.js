import React, { useEffect, useState } from "react";
import { Box, Button, Typography, Grid, TextField, InputAdornment, IconButton, FormControl, InputLabel, Select, MenuItem, Dialog, DialogContent, DialogActions } from "@mui/material"; 
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; 
import axios from 'axios';

// 커스텀 섹션 컴포넌트
import HeroSection from '../components/HeroSection';
import ProcessSection from '../components/ProcessSection';
import InfoSection from '../components/InfoSection';
import QASection from '../components/QASection';
import FloatingButtons from '../components/FloatingButtons';

// ✅ 기본 차량 사진
import damasImg from '../assets/damas.png'; 
import bikeImg from '../assets/bike.png'; 
import ton1Img from '../assets/1truck.png';
import ton11Img from '../assets/11truck.png';
import ton18Img from '../assets/18truck.png';
import ton25Img from '../assets/25truck.png';
import { API_SERVER_HOST } from "../api/serverConfig";

// ✅ 특수 차량 5종 사진
import topTruckImg from '../assets/toptruck.png';
import wingImg from '../assets/wing.png';
import jangImg from '../assets/jangkkuktruck.png';
import liftImg from '../assets/lift.png';
import iceTruckImg from '../assets/icetruck.png';

import MainFeesUtil from "../layout/component/common/MainFeesUtil";

// API 로직 임포트
import { postSearchFeesBasic } from "../api/estimateApi/estimateApi";
import { calculateDistanceBetweenAddresses } from "../layout/component/common/calculateDistanceBetweenAddresses";
import { getNotices } from "../api/noticeApi";

// ✅ 초기 상태 정의
const initState = {
  startAddress: '', 
  endAddress: '', 
  cargoType: '', 
  cargoWeight: '', 
  totalCost: 0, 
  distanceKm: ''
};

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
  const [selectedSpecialIndex, setSelectedSpecialIndex] = useState(0);

  const handlePrevSpecial = () =>
    setSelectedSpecialIndex(prev => (prev === 0 ? specialVehicleList.length - 1 : prev - 1));

  const handleNextSpecial = () =>
    setSelectedSpecialIndex(prev => (prev === specialVehicleList.length - 1 ? 0 : prev + 1));

  // ✅ 실제로 화면에 보여줄 통합 리스트
  const [displayVehicles, setDisplayVehicles] = useState([]);

  const { roles, memberId } = useSelector(state => state.login || { roles: [], memberId: null });
  const isDriver = roles.includes("ROLE_DRIVER");
  const navigate = useNavigate();

  const DEFAULT_TRUCK_IMG = "/image/placeholders/truck.svg";

  // ✅ 이미지 경로 보정 함수
  const normalizeUrl = (p) => {
    if (!p) return null;
    const s = String(p).trim().replace(/\\/g, "/");
    if (s.startsWith('http')) return s;
    const base = API_SERVER_HOST.replace(/\/+$/, "");
    if (s.startsWith('/g2i4/uploads/')) return `${base}${s}`;
    if (s.startsWith('/uploads/')) return `${base}/g2i4${s}`; 
    return `${base}/g2i4/uploads/cargo/${encodeURIComponent(s)}`;
  };

  // 🚨 [핵심 로직] 요금표(껍데기) 기준이 아니라, "실제 등록된 차량" 기준으로 화면을 그립니다.
  const fetchUnifiedVehicles = async () => {
    try {
      // 1. 요금표 데이터 가져오기 (설명글/가격 매칭용으로만 씀)
      const feesRes = await postSearchFeesBasic();
      const feesData = Array.isArray(feesRes) ? feesRes : [];
      setFees(feesData);

      // 2. 승인된 차량 목록 가져오기 (안전장치 추가)
      let cargoList = [];
      try {
        // 우선 전체 승인 차량 API 호출 시도
        const res = await axios.get(`${API_SERVER_HOST}/g2i4/cargo/all/approved`);
        cargoList = res.data || [];
      } catch (e) {
        // 만약 위 API가 백엔드에 없어서 에러가 나면, 기존 API에서 APPROVED만 직접 걸러냄
        const res = await axios.get(`${API_SERVER_HOST}/g2i4/cargo/list/test2`);
        cargoList = (res.data || []).filter(c => c.status === 'APPROVED');
      }

      // 3. FIFO 제한 (10개 초과 시 오래된 것 삭제)
      if (cargoList.length > 10) {
        cargoList = cargoList.slice(cargoList.length - 10);
      }

      // 4. 화면에 그리기 (cargoList가 있을 때만!)
      if (cargoList.length > 0) {
        const combined = cargoList.map(c => {
          const cleanCapacity = String(c.cargoCapacity || "").replace(/[^0-9.]/g, "").trim();
          
          // 내 차량의 무게와 요금표의 무게가 같으면 가격을 가져옴
          const feeMatch = feesData.find(f => 
            String(f.weight || "").replace(/[^0-9.]/g, "").trim() === cleanCapacity
          );

          return {
            name: c.cargoName || c.cargoCapacity, // 등록한 이름 그대로 (다마스)
            desc1: `${c.cargoCapacity}급 전문 운송 서비스입니다.`,
            desc2: feeMatch 
              ? `기본요금: ${Number(feeMatch.initialCharge).toLocaleString()}원 / km당: ${Number(feeMatch.ratePerKm).toLocaleString()}원` 
              : "최적의 거리별 요금을 실시간으로 제공해드립니다.",
            img: normalizeUrl(c.cargoImage) || DEFAULT_TRUCK_IMG
          };
        });
        setDisplayVehicles(combined);
      } else {
        // 등록/승인된 차량이 아예 하나도 없을 때만 기본(오토바이, 다마스) 출력
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
      <HeroSection />
      <ProcessSection />
      <InfoSection />
      <QASection />

      <section className="py-24 bg-[#f8f9fb] font-sans text-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="w-full lg:w-1/3">
              <div className="mb-4">
                <h2 className="text-4xl md:text-5xl font-black mb-4">용달화물 서비스 소개</h2>
                <p className="text-gray-600 text-lg">마이페이지에서 등록한 모든 차량이 실시간으로 공유됩니다.</p>
              </div>

              {/* ✅ 스크롤바 숨김 클래스 유지 */}
              <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto p-4 -m-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
                {displayVehicles.map((vehicle, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedVehicleIndex(index)}
                    className={`py-3 px-5 rounded-[2rem] flex justify-between items-center transition-all duration-300 ${
                      selectedVehicleIndex === index
                        ? 'bg-red-600 shadow-lg scale-105'
                        : 'bg-white border border-gray-100 shadow-sm hover:border-red-200 hover:shadow-md'
                    }`}
                  >
                    <span className="flex items-center gap-6">
                      <span className={`font-bold text-xl ${selectedVehicleIndex === index ? 'text-white' : 'text-gray-400'}`}>
                        {index < 9 ? `0${index + 1}` : index + 1}
                      </span>
                      <span className={`text-xl font-bold ${selectedVehicleIndex === index ? 'text-white' : 'text-gray-900'}`}>
                        {vehicle.name}
                      </span>
                    </span>
                    <span className={`text-2xl ${selectedVehicleIndex === index ? 'text-white' : 'text-gray-300'}`}>〉</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-2/3 flex flex-col justify-start gap-12 mt-2 lg:mt-0"> 
              {displayVehicles[selectedVehicleIndex] && (
                <div className="flex flex-col h-full">
                  {/* 번호 (장식용) */}
                  <p className="text-8xl md:text-9xl font-black text-red-100 leading-none select-none -mb-4">
                    {selectedVehicleIndex < 9 ? `0${selectedVehicleIndex + 1}` : selectedVehicleIndex + 1}
                  </p>
                  {/* 타이틀 */}
                  <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                    {displayVehicles[selectedVehicleIndex].name}
                  </h3>
                  {/* 설명 */}
                  <p className="text-gray-800 text-lg md:text-xl font-bold mb-2">
                    {displayVehicles[selectedVehicleIndex].desc1}
                  </p>
                  <p className="text-gray-500 text-base mb-8">
                    {displayVehicles[selectedVehicleIndex].desc2}
                  </p>
                  {/* 차량 이미지 */}
                  <div className="flex-1 flex items-end justify-end">
                    <img
                      src={displayVehicles[selectedVehicleIndex].img}
                      alt={displayVehicles[selectedVehicleIndex].name}
                      onError={(e) => { e.target.src = DEFAULT_TRUCK_IMG; }}
                      className="w-full max-w-[560px] h-auto object-contain drop-shadow-2xl"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white border-t border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">

          {/* 헤더 */}
          <div className="text-center mb-16">
            <p className="text-red-600 font-bold text-sm tracking-[0.2em] uppercase mb-3">Special Vehicles</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900">
              원하는 차량, 퍼스트로드엔 다 있습니다
            </h2>
          </div>

          {/* 캐러셀 */}
          <div className="flex items-end justify-center gap-4 md:gap-10">

            {/* 이전 버튼 */}
            <button
              onClick={handlePrevSpecial}
              className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-gray-200 flex items-center justify-center text-2xl text-gray-400 hover:border-red-600 hover:text-red-600 bg-white shadow-sm transition-all duration-300 mb-16"
              aria-label="이전 차량"
            >
              ‹
            </button>

            {/* 차량 목록 — 데스크탑: 전체, 모바일: 활성만 */}
            <div className="flex items-end justify-center gap-4 md:gap-8 flex-1">
              {specialVehicleList.map((vehicle, idx) => {
                const isActive = idx === selectedSpecialIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedSpecialIndex(idx)}
                    className={`flex flex-col items-center transition-all duration-500 cursor-pointer focus:outline-none ${
                      isActive
                        ? 'opacity-100 scale-110'
                        : 'opacity-30 scale-90 hover:opacity-60 hidden md:flex'
                    }`}
                  >
                    <img
                      src={vehicle.img}
                      alt={vehicle.name}
                      className={`object-contain transition-all duration-500 ${
                        isActive ? 'w-40 md:w-56 h-auto' : 'w-24 md:w-36 h-auto'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* 다음 버튼 */}
            <button
              onClick={handleNextSpecial}
              className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-gray-200 flex items-center justify-center text-2xl text-gray-400 hover:border-red-600 hover:text-red-600 bg-white shadow-sm transition-all duration-300 mb-16"
              aria-label="다음 차량"
            >
              ›
            </button>
          </div>

          {/* 활성 차량 이름 + 설명 */}
          <div className="text-center mt-6">
            <h3 className="text-3xl font-black text-gray-900 mb-2">
              {specialVehicleList[selectedSpecialIndex].name}
            </h3>
            <p className="text-gray-500 text-lg">
              {specialVehicleList[selectedSpecialIndex].desc}
            </p>
          </div>

          {/* 점 인디케이터 */}
          <div className="flex justify-center gap-2 mt-8">
            {specialVehicleList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSpecialIndex(idx)}
                className={`rounded-full transition-all duration-300 ${
                  idx === selectedSpecialIndex
                    ? 'bg-red-600 w-8 h-2.5'
                    : 'bg-gray-200 w-2.5 h-2.5 hover:bg-gray-400'
                }`}
                aria-label={`${idx + 1}번째 차량`}
              />
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