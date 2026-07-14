import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import HeroSection from "../components/HeroSection";
import ProcessSection from "../components/ProcessSection";
import InfoSection from "../components/InfoSection";
import QASection from "../components/QASection";

import damasImg from "../assets/damas.png";
import bikeImg from "../assets/bike.png";
import ton25Img from "../assets/25truck.png";
import mainVideo from "../assets/mainpage.mp4";
import topTruckImg from "../assets/toptruck.png";
import wingImg from "../assets/wing.png";
import jangImg from "../assets/jangkkuktruck.png";
import liftImg from "../assets/lift.png";
import iceTruckImg from "../assets/icetruck.png";

import { API_SERVER_HOST } from "../api/serverConfig";
import MainFeesUtil from "../layout/component/common/MainFeesUtil";
import { postSearchFeesBasic } from "../api/estimateApi/estimateApi";

const DEFAULT_TRUCK_IMG = ton25Img;

const specialVehicleList = [
  { name: "탑차", img: topTruckImg, desc: "비와 눈을 막는 폐쇄형 적재함" },
  { name: "윙바디", img: wingImg, desc: "측면 개방으로 팔레트 상하차에 유리" },
  { name: "장축", img: jangImg, desc: "표준보다 긴 적재함을 갖춘 차량" },
  { name: "리프트", img: liftImg, desc: "파워게이트 장착으로 무거운 화물 대응" },
  { name: "냉동차", img: iceTruckImg, desc: "신선식품과 온도 민감 화물 운송" },
];

const vehicleStaticList = [
  {
    name: "오토바이 퀵",
    desc1: "도심 서류와 소형 물품을 빠르게 연결합니다.",
    desc2: "혼잡한 시간대에도 기동성 있는 배송이 가능합니다.",
    img: bikeImg,
  },
  {
    name: "다마스 용달",
    desc1: "소형 화물과 1인 가구 운송에 맞춘 차량입니다.",
    desc2: "합리적인 비용으로 가까운 거리 운송에 적합합니다.",
    img: damasImg,
  },
];

function normalizeUrl(path) {
  if (!path) return null;

  const value = String(path).trim().replace(/\\/g, "/");
  if (value.startsWith("http")) return value;

  const base = API_SERVER_HOST.replace(/\/+$/, "");
  if (value.startsWith("/fr/uploads/")) return `${base}${value}`;
  if (value.startsWith("/uploads/")) return `${base}/fr${value}`;

  return `${base}/fr/uploads/cargo/${encodeURIComponent(value)}`;
}

function HomeModeSwitch({ mode, onChange }) {
  const modes = [
    { key: "classic", label: "일반형", caption: "기존 홈" },
    { key: "responsive", label: "발표형", caption: "보강 홈" },
  ];
  const isPresentation = mode === "responsive";

  return (
    <div
      className={`fixed z-40 font-sans ${
        isPresentation ? "right-4 top-[82px] sm:right-6 lg:right-10 lg:top-[92px]" : "right-4 top-[76px] sm:right-6 lg:right-10 lg:top-[86px]"
      }`}
    >
      <div
        className={`flex items-center gap-2 rounded-full px-1 py-1 backdrop-blur-[2px] ${
          isPresentation
            ? "bg-[#080d14]/68 text-white shadow-[0_16px_42px_rgba(0,0,0,0.28)]"
            : "text-[#172033]"
        }`}
      >
        <span className="hidden pl-2 pr-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#e52424] sm:inline-flex">
          View
        </span>

        <div className="grid grid-cols-2 gap-1">
          {modes.map((item) => {
            const active = item.key === mode;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                className={`rounded-full px-2.5 py-1.5 text-left transition-all sm:px-3 ${
                  active
                    ? "bg-[#e52424] text-white shadow-[0_8px_22px_rgba(229,36,36,0.24)]"
                    : isPresentation
                      ? "bg-transparent text-white/70 hover:text-white"
                      : "bg-transparent text-[#667085] hover:text-[#172033]"
                }`}
              >
                <span className="block whitespace-nowrap text-xs font-black leading-none sm:text-sm">{item.label}</span>
                <span
                  className={`mt-1 hidden text-[10px] font-bold sm:block ${
                    active ? "text-white/72" : isPresentation ? "text-white/50" : "text-[#98a2b3]"
                  }`}
                >
                  {item.caption}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VehicleShowcase({ vehicles, selectedIndex, onSelect, compact = false }) {
  const selectedVehicle = vehicles[selectedIndex] || vehicles[0];

  return (
    <section className={`${compact ? "bg-[#f4f6f8] py-16" : "bg-[#f8f9fb] py-24"} font-sans text-gray-900`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className={`grid gap-10 ${compact ? "lg:grid-cols-[0.9fr_1.1fr]" : "lg:grid-cols-[0.72fr_1.28fr] lg:gap-16"}`}>
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-red-600">Fleet Lineup</p>
            <h2 className={`${compact ? "text-3xl sm:text-4xl" : "text-4xl md:text-5xl"} mb-4 font-black leading-tight`}>
              필요한 차량을 빠르게 고르고 바로 접수합니다.
            </h2>
            <p className="mb-7 max-w-xl text-base font-semibold leading-7 text-gray-500">
              등록된 승인 차량을 우선 노출하고, 없을 때는 기본 운송 차량으로 안내합니다.
            </p>

            <div className="grid max-h-[520px] gap-3 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {vehicles.map((vehicle, index) => {
                const active = selectedIndex === index;
                return (
                  <button
                    key={`${vehicle.name}-${index}`}
                    type="button"
                    onClick={() => onSelect(index)}
                    className={`flex items-center justify-between rounded-3xl border px-5 py-4 text-left transition-all ${
                      active
                        ? "border-red-600 bg-red-600 text-white shadow-xl shadow-red-600/18"
                        : "border-gray-100 bg-white text-gray-900 shadow-sm hover:border-red-200"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className={`text-lg font-black ${active ? "text-white/78" : "text-gray-300"}`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate text-lg font-black">{vehicle.name}</span>
                    </span>
                    <span className={`text-2xl ${active ? "text-white" : "text-gray-300"}`}>›</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 shadow-2xl shadow-gray-200/70 sm:p-8">
            <div className="absolute right-[-8%] top-[-16%] h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
            {selectedVehicle && (
              <div className="relative grid h-full gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
                <div>
                  <p className="mb-2 text-7xl font-black leading-none text-red-100">
                    {String(selectedIndex + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mb-4 text-3xl font-black sm:text-5xl">{selectedVehicle.name}</h3>
                  <p className="mb-2 text-lg font-black text-gray-800">{selectedVehicle.desc1}</p>
                  <p className="text-sm font-semibold leading-7 text-gray-500 sm:text-base">{selectedVehicle.desc2}</p>
                </div>

                <div className="flex min-h-[240px] items-end justify-center lg:justify-end">
                  <img
                    src={selectedVehicle.img}
                    alt={selectedVehicle.name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_TRUCK_IMG;
                    }}
                    className="max-h-[320px] w-full max-w-[560px] object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecialVehicleSection({ selectedIndex, onPrev, onNext, onSelect, compact = false }) {
  const activeVehicle = specialVehicleList[selectedIndex] || specialVehicleList[0];

  if (compact) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-red-600">Special Vehicles</p>
              <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">특수 차량도 한 화면에서 비교합니다.</h2>
            </div>
            <div className="flex gap-2">
              <button className="h-11 w-11 rounded-full border border-gray-200 text-2xl" type="button" onClick={onPrev}>
                ‹
              </button>
              <button className="h-11 w-11 rounded-full border border-gray-200 text-2xl" type="button" onClick={onNext}>
                ›
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {specialVehicleList.map((item, index) => {
              const active = index === selectedIndex;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => onSelect(index)}
                  className={`rounded-[1.6rem] border p-5 text-left transition-all ${
                    active ? "border-red-600 bg-red-50 shadow-lg" : "border-gray-100 bg-white hover:border-red-200"
                  }`}
                >
                  <div className="mb-4 flex h-32 items-center justify-center">
                    <img src={item.img} alt={item.name} className="max-h-32 w-full object-contain" />
                  </div>
                  <h3 className="mb-1 text-xl font-black text-gray-900">{item.name}</h3>
                  <p className="text-sm font-semibold leading-6 text-gray-500">{item.desc}</p>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-sm font-bold text-gray-500">
            선택 차량: <span className="text-red-600">{activeVehicle.name}</span> · {activeVehicle.desc}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden border-t border-gray-100 bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-red-600">Special Vehicles</p>
          <h2 className="text-4xl font-black text-gray-900 md:text-5xl">원하는 차량, 퍼스트로드는 다 있습니다</h2>
        </div>

        <div className="flex items-center justify-center gap-4 md:gap-10">
          <button
            type="button"
            onClick={onPrev}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-2xl text-gray-400 shadow-sm transition-all hover:border-red-600 hover:text-red-600 md:h-14 md:w-14"
            aria-label="이전 차량"
          >
            ‹
          </button>

          <div className="flex h-44 flex-1 items-center justify-center gap-4 md:h-64 md:gap-8">
            {specialVehicleList.map((vehicle, index) => {
              const active = index === selectedIndex;
              return (
                <button
                  key={vehicle.name}
                  type="button"
                  onClick={() => onSelect(index)}
                  className={`flex cursor-pointer flex-col items-center transition-all duration-500 focus:outline-none ${
                    active ? "scale-110 opacity-100" : "hidden scale-90 opacity-30 hover:opacity-60 md:flex"
                  }`}
                >
                  <img
                    src={vehicle.img}
                    alt={vehicle.name}
                    className={`object-contain transition-all duration-500 ${
                      active ? "h-40 w-40 md:h-56 md:w-56" : "h-24 w-24 md:h-36 md:w-36"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onNext}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-2xl text-gray-400 shadow-sm transition-all hover:border-red-600 hover:text-red-600 md:h-14 md:w-14"
            aria-label="다음 차량"
          >
            ›
          </button>
        </div>

        <div className="mt-6 text-center">
          <h3 className="mb-2 text-3xl font-black text-gray-900">{activeVehicle.name}</h3>
          <p className="text-lg text-gray-500">{activeVehicle.desc}</p>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {specialVehicleList.map((item, index) => (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelect(index)}
              className={`rounded-full transition-all duration-300 ${
                index === selectedIndex ? "h-2.5 w-8 bg-red-600" : "h-2.5 w-2.5 bg-gray-200 hover:bg-gray-400"
              }`}
              aria-label={`${index + 1}번째 차량`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ClassicHome({
  vehicles,
  selectedVehicleIndex,
  onVehicleSelect,
  selectedSpecialIndex,
  onPrevSpecial,
  onNextSpecial,
  onSpecialSelect,
}) {
  return (
    <>
      <HeroSection />
      <ProcessSection />
      <InfoSection />
      <QASection />
      <VehicleShowcase vehicles={vehicles} selectedIndex={selectedVehicleIndex} onSelect={onVehicleSelect} />
      <SpecialVehicleSection
        selectedIndex={selectedSpecialIndex}
        onPrev={onPrevSpecial}
        onNext={onNextSpecial}
        onSelect={onSpecialSelect}
      />
    </>
  );
}

function ResponsiveHome() {
  const navigate = useNavigate();

  const services = [
    ["01", "실시간 운송 접수", "출발지, 도착지, 화물 조건을 한 흐름으로 입력합니다."],
    ["02", "차량 유형 선택", "오토바이 퀵부터 대형 트럭까지 목적에 맞게 고릅니다."],
    ["03", "요금 간편조회", "거리와 조건을 기준으로 예상 비용을 빠르게 확인합니다."],
    ["04", "기사 배차 연결", "접수 이후 가장 적합한 차량과 기사 배차 흐름을 연결합니다."],
    ["05", "운송 경로 관제", "이동 중에도 경로와 운송 상태를 한 화면에서 확인합니다."],
    ["06", "배송완료 확인", "도착 확인, 내역 정리, 다음 접수까지 자연스럽게 이어집니다."],
  ];

  const advantages = [
    ["24H", "언제든 접수", "야간과 급한 일정에도 운송 흐름을 놓치지 않습니다."],
    ["ROUTE", "경로 우선 판단", "거리, 시간, 도로 상황을 기준으로 먼저 도착하는 선택지를 만듭니다."],
    ["FLEET", "차량 폭 확장", "소형 퀵부터 대형 화물차까지 한 화면에서 비교합니다."],
    ["CONTROL", "접수 이후 관리", "요금 확인, 차량 선택, 접수 이동을 발표 화면 안에서 바로 연결합니다."],
  ];

  const heroRef = useRef(null);
  const [heroProgress, setHeroProgress] = useState(0);
  const [manualServiceIndex, setManualServiceIndex] = useState(null);
  const [activeFleetIndex, setActiveFleetIndex] = useState(0);
  const serviceCount = services.length;
  const scrollServiceIndex = Math.min(serviceCount - 1, Math.floor(heroProgress * serviceCount));
  const activeServiceIndex = manualServiceIndex ?? scrollServiceIndex;
  const [activeNumber, activeTitle, activeDesc] = services[activeServiceIndex];
  const activeFleet = specialVehicleList[activeFleetIndex] || specialVehicleList[0];

  const handlePrevService = useCallback(() => {
    setManualServiceIndex((prev) => {
      const base = prev ?? scrollServiceIndex;
      return base === 0 ? serviceCount - 1 : base - 1;
    });
  }, [scrollServiceIndex, serviceCount]);

  const handleNextService = useCallback(() => {
    setManualServiceIndex((prev) => {
      const base = prev ?? scrollServiceIndex;
      return base === serviceCount - 1 ? 0 : base + 1;
    });
  }, [scrollServiceIndex, serviceCount]);

  const handlePrevFleet = useCallback(() => {
    setActiveFleetIndex((prev) => (prev === 0 ? specialVehicleList.length - 1 : prev - 1));
  }, []);

  const handleNextFleet = useCallback(() => {
    setActiveFleetIndex((prev) => (prev === specialVehicleList.length - 1 ? 0 : prev + 1));
  }, []);

  const handlePresentationVideoLoaded = useCallback((event) => {
    event.currentTarget.playbackRate = 0.55;
  }, []);

  const handleOutroVideoLoaded = useCallback((event) => {
    event.currentTarget.playbackRate = 0.42;
  }, []);

  useEffect(() => {
    let frameId = null;

    const updateProgress = () => {
      frameId = null;

      const hero = heroRef.current;
      if (!hero) return;

      const rect = hero.getBoundingClientRect();
      const availableScroll = Math.max(1, hero.offsetHeight - window.innerHeight);
      const nextProgress = Math.min(1, Math.max(0, -rect.top / availableScroll));

      setHeroProgress((prevProgress) => {
        if (Math.abs(prevProgress - nextProgress) < 0.01) return prevProgress;
        return nextProgress;
      });
    };

    const requestUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return (
    <>
      <section ref={heroRef} data-header-tone="light" className="relative h-[760vh] bg-[#080d14] text-white">
        <div className="sticky top-0 h-screen overflow-hidden">
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-55"
            src={mainVideo}
            autoPlay
            loop
            muted
            playsInline
            onLoadedMetadata={handlePresentationVideoLoaded}
            style={{
              transform: `scale(${1 + heroProgress * 0.1}) translateX(${-heroProgress * 2.5}%)`,
              transition: "transform 180ms linear",
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,20,0.96)_0%,rgba(8,13,20,0.78)_44%,rgba(8,13,20,0.42)_100%)]" />
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(229,36,36,0.34),transparent_34%)]"
            style={{ opacity: 0.75 - heroProgress * 0.25 }}
          />

          <div className="relative z-10 flex h-full flex-col justify-end px-5 pb-16 pt-28 sm:px-8 lg:px-10 lg:pb-20">
            <div className="grid items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div
                style={{
                  transform: `translateY(${-heroProgress * 38}px)`,
                  opacity: Math.max(0, 1 - Math.max(0, heroProgress - 0.48) * 2.2),
                }}
              >
                <p className="mb-5 text-xs font-black uppercase tracking-[0.36em] text-red-300 sm:text-sm">
                  Responsive Route Control
                </p>
                <h1 className="max-w-5xl text-[clamp(3.8rem,9vw,8.8rem)] font-black uppercase leading-[0.86] tracking-[-0.07em]">
                  Arrive First.
                  <span className="block text-red-400">Move Smarter.</span>
                </h1>
                <p className="mt-8 max-w-2xl text-lg font-bold leading-8 text-white/72">
                  긴 설명 대신 스크롤 한 번으로 접수, 배차, 운송, 배송완료까지 한 장면 안에서 이어집니다.
                </p>
              </div>

              <article className="relative overflow-hidden rounded-[2rem] bg-white p-5 text-[#121826] shadow-[0_34px_90px_rgba(0,0,0,0.34)] sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[#1d2a57]">
                    <span>{activeNumber} / {String(serviceCount).padStart(2, "0")}</span>
                    <span className="ml-4 text-[#e52424]">Our Services</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePrevService}
                      className="h-10 w-10 rounded-full border border-[#d8dde8] text-xl font-black text-[#1d2a57] transition hover:border-[#e52424] hover:text-[#e52424]"
                      aria-label="이전 서비스"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={handleNextService}
                      className="h-10 w-10 rounded-full border border-[#d8dde8] text-xl font-black text-[#1d2a57] transition hover:border-[#e52424] hover:text-[#e52424]"
                      aria-label="다음 서비스"
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div className="min-h-[230px] rounded-[1.5rem] bg-[#f4f6fb] p-6">
                  <p className="mb-5 text-xs font-black uppercase tracking-[0.26em] text-[#e52424]">Flow Step</p>
                  <h2 className="mb-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-[#1d2a57] sm:text-5xl">
                    {activeTitle}
                  </h2>
                  <p className="max-w-lg text-base font-bold leading-7 text-[#5d6677]">{activeDesc}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {services.map(([number], index) => {
                    const active = index === activeServiceIndex;
                    return (
                      <button
                        key={number}
                        type="button"
                        onClick={() => setManualServiceIndex(index)}
                        className={`h-9 min-w-9 rounded-full px-3 text-xs font-black transition ${
                          active ? "bg-[#1d2a57] text-white shadow-[0_10px_22px_rgba(29,42,87,0.22)]" : "bg-[#eef1f6] text-[#8992a3] hover:text-[#1d2a57]"
                        }`}
                        aria-label={`${number}번 서비스 보기`}
                      >
                        {number}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/quick-search")}
                    className="rounded-full border border-[#d8dde8] px-6 py-3 text-sm font-black text-[#121826] transition hover:border-[#e52424] hover:text-[#e52424]"
                  >
                    간편 조회
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/estimatepage")}
                    className="rounded-full bg-[#e52424] px-6 py-3 text-sm font-black text-white transition hover:bg-red-500"
                  >
                    온라인 퀵 접수
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section data-header-tone="dark" className="bg-white text-[#1d2a57]">
        <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-0">
          <div className="lg:sticky lg:top-28 lg:flex lg:h-[calc(100vh-7rem)] lg:flex-col lg:justify-center lg:pt-10">
            <p className="mb-5 text-sm font-black uppercase tracking-[0.32em] text-[#e52424]">First Road Advantages</p>
            <h2 className="text-[clamp(4rem,9vw,8.5rem)] font-black uppercase leading-[0.78] tracking-[-0.08em]">
              Our
              <span className="block">Advantages</span>
            </h2>
          </div>

          <div className="grid gap-5 py-0 lg:py-[14vh]">
            {advantages.map(([title, label, desc]) => (
              <article key={title} className="grid min-h-[240px] gap-6 rounded-[2rem] bg-[#f3f4f8] p-8 sm:grid-cols-[0.55fr_1fr] sm:items-center lg:min-h-[280px]">
                <h3 className="text-5xl font-black uppercase leading-[0.82] tracking-[-0.07em] sm:text-6xl">{title}</h3>
                <div>
                  <p className="mb-3 text-xl font-black tracking-[-0.04em] text-[#121826]">{label}</p>
                  <p className="text-base font-bold leading-7 text-[#596173]">{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section data-header-tone="dark" className="bg-[#f7f8fb] px-5 py-28 text-[#121826] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-[#e52424]">Fleet Focus</p>
              <h2 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                차량은 하나씩,
                <span className="block">조건은 선명하게.</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                className="h-12 w-12 rounded-full border border-[#d8dde8] text-2xl font-black transition hover:border-[#e52424] hover:text-[#e52424]"
                type="button"
                onClick={handlePrevFleet}
                aria-label="이전 차량"
              >
                ‹
              </button>
              <button
                className="h-12 w-12 rounded-full border border-[#d8dde8] text-2xl font-black transition hover:border-[#e52424] hover:text-[#e52424]"
                type="button"
                onClick={handleNextFleet}
                aria-label="다음 차량"
              >
                ›
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2.8rem] border border-white bg-[linear-gradient(135deg,#fbfcff_0%,#eef2f8_100%)] shadow-[0_38px_110px_rgba(18,24,38,0.10)] lg:grid lg:min-h-[640px] lg:grid-cols-[1.02fr_0.98fr]">
            <div className="relative min-h-[430px] overflow-hidden p-6 sm:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_48%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.58)_34%,rgba(229,36,36,0.08)_58%,transparent_78%)]" />
              <p className="absolute left-8 top-8 z-10 text-xs font-black uppercase tracking-[0.28em] text-[#1d2a57]/45">First Road Fleet</p>
              <img
                src={activeFleet.img}
                alt={activeFleet.name}
                className="relative z-10 mx-auto h-full max-h-[540px] w-full object-contain mix-blend-multiply drop-shadow-[0_30px_38px_rgba(18,24,38,0.18)]"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(ellipse 74% 66% at 50% 52%, #000 58%, rgba(0,0,0,0.76) 74%, transparent 100%)",
                  maskImage:
                    "radial-gradient(ellipse 74% 66% at 50% 52%, #000 58%, rgba(0,0,0,0.76) 74%, transparent 100%)",
                }}
              />
            </div>

            <div className="relative flex flex-col justify-between gap-10 p-7 sm:p-10 lg:p-12">
              <span className="pointer-events-none absolute right-8 top-8 text-[9rem] font-black leading-none tracking-[-0.08em] text-[#1d2a57]/[0.04]">
                {String(activeFleetIndex + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-wrap gap-2">
                {specialVehicleList.map((item, index) => {
                  const active = index === activeFleetIndex;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setActiveFleetIndex(index)}
                      className={`rounded-full px-4 py-2 text-sm font-black transition ${
                        active ? "bg-[#1d2a57] text-white shadow-[0_14px_28px_rgba(29,42,87,0.18)]" : "bg-white/84 text-[#667085] hover:text-[#1d2a57]"
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>

              <div>
                <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-[#e52424]">Selected Vehicle</p>
                <h3 className="mb-5 text-[clamp(4rem,9vw,7.5rem)] font-black uppercase leading-[0.78] tracking-[-0.08em] text-[#1d2a57]">
                  {activeFleet.name}
                </h3>
                <p className="max-w-xl text-lg font-bold leading-8 text-[#596173]">
                  {activeFleet.desc}. 화물 조건을 먼저 확인하고, 필요한 차량만 빠르게 선택해 접수 흐름으로 연결합니다.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {["날씨 보호", "조건 비교", "빠른 접수"].map((item) => (
                    <div key={item} className="rounded-2xl bg-white/78 px-4 py-4 text-sm font-black text-[#1d2a57] shadow-[0_12px_34px_rgba(18,24,38,0.04)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate("/quick-search")}
                  className="rounded-full border border-[#d8dde8] bg-white px-8 py-4 text-base font-black text-[#121826] transition hover:border-[#e52424] hover:text-[#e52424]"
                >
                  간편 조회
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/estimatepage")}
                  className="rounded-full bg-[#e52424] px-8 py-4 text-base font-black text-white transition hover:bg-red-500"
                >
                  온라인 퀵 접수
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-header-tone="light" className="relative min-h-[125vh] overflow-hidden bg-[#05080d] px-5 py-28 text-white sm:px-8 lg:px-10">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-24"
          src={mainVideo}
          autoPlay
          loop
          muted
          playsInline
          onLoadedMetadata={handleOutroVideoLoaded}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,13,0.92)_0%,rgba(5,8,13,0.72)_45%,rgba(5,8,13,0.98)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(circle_at_50%_100%,rgba(229,36,36,0.24),transparent_50%)]" />

        <div className="relative mx-auto flex min-h-[calc(100vh-12rem)] max-w-[1500px] flex-col justify-end">
          <div className="mb-14 flex flex-col gap-6 border-b border-white/18 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-5 text-xs font-black uppercase tracking-[0.34em] text-red-300">First Road Logistics</p>
              <h2 className="max-w-4xl text-[clamp(3rem,7vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.08em]">
                가장 먼저 도착하는 브랜드.
              </h2>
              <p className="mt-6 max-w-2xl text-base font-bold leading-7 text-white/58">
                발표형 홈은 운송 접수와 조회를 마지막 행동으로 남기고, 브랜드 이름이 영화 엔딩처럼 크게 기억되도록 마무리합니다.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/quick-search")}
                className="rounded-full border border-white/18 bg-white/8 px-8 py-4 text-base font-black text-white backdrop-blur transition hover:border-white/48 hover:bg-white/14"
              >
                간편 조회
              </button>
              <button
                type="button"
                onClick={() => navigate("/estimatepage")}
                className="rounded-full bg-[#e52424] px-8 py-4 text-base font-black text-white shadow-[0_18px_45px_rgba(229,36,36,0.26)] transition hover:bg-red-500"
              >
                온라인 퀵 접수
              </button>
            </div>
          </div>

          <div className="mb-14 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-8">
              <p className="mb-5 text-xs font-black uppercase tracking-[0.28em] text-red-300">Delivery Film</p>
              <h3 className="text-4xl font-black uppercase leading-[0.88] tracking-[-0.06em] sm:text-5xl">
                Pickup to
                <span className="block text-red-300">Complete.</span>
              </h3>
              <p className="mt-5 max-w-md text-sm font-bold leading-7 text-white/56">
                영상은 천천히 흐르고, 마지막 컷은 배송 완료 상태로 닫히도록 연출했습니다.
              </p>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/[0.92] p-6 text-[#101827] shadow-[0_34px_90px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:p-8">
              <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e52424]">Delivery Complete</p>
                  <h3 className="mt-3 text-4xl font-black tracking-[-0.06em] text-[#1d2a57] sm:text-5xl">배송완료 확인</h3>
                </div>
                <span className="rounded-full bg-[#1d2a57] px-5 py-2 text-sm font-black text-white">06 / 06</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {["접수", "배차", "이동", "완료"].map((item, index) => (
                  <div
                    key={item}
                    className={`rounded-2xl px-4 py-4 text-sm font-black ${
                      index === 3 ? "bg-[#e52424] text-white" : "bg-[#eef1f6] text-[#1d2a57]"
                    }`}
                  >
                    <span className="mb-2 block text-xs opacity-60">{String(index + 1).padStart(2, "0")}</span>
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </div>

          <h3 className="select-none text-[clamp(4.8rem,16vw,17rem)] font-black uppercase leading-[0.72] tracking-[-0.11em] text-white">
            First Road
          </h3>
        </div>
      </section>
    </>
  );
}

export default function HomePage() {
  const [homeMode, setHomeMode] = useState(() => {
    try {
      const savedMode = window.localStorage?.getItem("firstroad-home-mode");
      return savedMode === "classic" || savedMode === "responsive" ? savedMode : "responsive";
    } catch (error) {
      return "responsive";
    }
  });
  const [displayVehicles, setDisplayVehicles] = useState(vehicleStaticList);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [selectedSpecialIndex, setSelectedSpecialIndex] = useState(0);
  const [openFees, setOpenFees] = useState(false);

  const { memberId } = useSelector((state) => state.login || { memberId: null });

  const fetchUnifiedVehicles = useCallback(async () => {
    try {
      const feesRes = await postSearchFeesBasic();
      const feesData = Array.isArray(feesRes) ? feesRes : [];

      let cargoList = [];
      try {
        const response = await axios.get(`${API_SERVER_HOST}/fr/cargo/all/approved`);
        cargoList = (response.data || []).filter((cargo) => cargo.status === "APPROVED");
      } catch (error) {
        const response = await axios.get(`${API_SERVER_HOST}/fr/cargo/list/test2`);
        cargoList = (response.data || []).filter((cargo) => cargo.status === "APPROVED");
      }

      if (cargoList.length > 10) {
        cargoList = cargoList.slice(cargoList.length - 10);
      }

      if (cargoList.length === 0) {
        setDisplayVehicles(vehicleStaticList);
        return;
      }

      const vehicles = cargoList.map((cargo) => {
        const cleanCapacity = String(cargo.cargoCapacity || "").replace(/[^0-9.]/g, "").trim();
        const feeMatch = feesData.find(
          (fee) => String(fee.weight || "").replace(/[^0-9.]/g, "").trim() === cleanCapacity
        );

        return {
          name: cargo.cargoName || cargo.cargoCapacity || "화물 차량",
          desc1: `${cargo.cargoCapacity || "맞춤"}급 전문 운송 서비스입니다.`,
          desc2: feeMatch
            ? `기본요금: ${Number(feeMatch.initialCharge).toLocaleString()}원 / km당: ${Number(feeMatch.ratePerKm).toLocaleString()}원`
            : "거리와 조건에 맞춘 최적 운송 요금을 제공합니다.",
          img: normalizeUrl(cargo.cargoImage) || DEFAULT_TRUCK_IMG,
        };
      });

      setDisplayVehicles(vehicles);
    } catch (error) {
      console.error("홈 차량 데이터 로드 실패", error);
      setDisplayVehicles(vehicleStaticList);
    }
  }, []);

  useEffect(() => {
    fetchUnifiedVehicles();
  }, [fetchUnifiedVehicles, memberId]);

  useEffect(() => {
    if (selectedVehicleIndex >= displayVehicles.length) {
      setSelectedVehicleIndex(0);
    }
  }, [displayVehicles.length, selectedVehicleIndex]);

  useEffect(() => {
    document.documentElement.dataset.homeMode = homeMode;
    window.dispatchEvent(new CustomEvent("firstroad-home-mode"));

    return () => {
      delete document.documentElement.dataset.homeMode;
      window.dispatchEvent(new CustomEvent("firstroad-home-mode"));
    };
  }, [homeMode]);

  const handleModeChange = useCallback((nextMode) => {
    setHomeMode(nextMode);
    try {
      window.localStorage?.setItem("firstroad-home-mode", nextMode);
    } catch (error) {
      // Ignore storage failures; the visible mode still changes immediately.
    }
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  const handlePrevSpecial = useCallback(() => {
    setSelectedSpecialIndex((prev) => (prev === 0 ? specialVehicleList.length - 1 : prev - 1));
  }, []);

  const handleNextSpecial = useCallback(() => {
    setSelectedSpecialIndex((prev) => (prev === specialVehicleList.length - 1 ? 0 : prev + 1));
  }, []);

  const commonProps = useMemo(
    () => ({
      vehicles: displayVehicles,
      selectedVehicleIndex,
      onVehicleSelect: setSelectedVehicleIndex,
      selectedSpecialIndex,
      onPrevSpecial: handlePrevSpecial,
      onNextSpecial: handleNextSpecial,
      onSpecialSelect: setSelectedSpecialIndex,
    }),
    [displayVehicles, handleNextSpecial, handlePrevSpecial, selectedSpecialIndex, selectedVehicleIndex]
  );

  return (
    <Box sx={{ bgcolor: "#fff", width: "100%" }}>
      <HomeModeSwitch mode={homeMode} onChange={handleModeChange} />

      {homeMode === "classic" ? (
        <ClassicHome {...commonProps} />
      ) : (
        <ResponsiveHome {...commonProps} onConsult={() => setOpenFees(true)} />
      )}

      <MainFeesUtil
        open={openFees}
        onClose={() => setOpenFees(false)}
        onSuccess={() => {
          fetchUnifiedVehicles();
          setOpenFees(false);
        }}
      />
    </Box>
  );
}
