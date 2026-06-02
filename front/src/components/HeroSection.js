import React from 'react';
import { useNavigate } from "react-router-dom";
import truckImg from '../assets/25truck.png';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative w-full bg-white overflow-hidden font-sans">

      {/* ── 배경 장식 ── */}
      {/* 은은한 dot 패턴 */}
      <div
        className="absolute inset-0 z-0 opacity-[0.5] pointer-events-none
                   bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:22px_22px]"
      />
      {/* 우측 빨강 그라데이션 blob */}
      <div className="absolute top-1/4 right-[-6rem] z-0 w-[34rem] h-[34rem] rounded-full
                      bg-red-500/10 blur-3xl pointer-events-none" />
      {/* 좌하단 회색 blob */}
      <div className="absolute bottom-[-8rem] left-[-6rem] z-0 w-[30rem] h-[30rem] rounded-full
                      bg-gray-300/30 blur-3xl pointer-events-none" />

      {/* ── 메인 히어로 ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center lg:min-h-[88vh] py-8 lg:py-16 gap-4 lg:gap-8">

        {/* 좌측: 텍스트 */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center order-2 lg:order-1 py-2 lg:py-8">
          <p className="text-red-600 font-bold text-sm tracking-[0.2em] uppercase mb-3 lg:mb-5">
            First Road Platform
          </p>

          {/* 상단 뱃지/태그 */}
          <div className="flex flex-nowrap gap-1.5 sm:gap-2 mb-4 lg:mb-6">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-gray-100 text-gray-600 font-semibold
                             whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3.5 py-1.5 rounded-full border border-gray-200">
              <span className="text-red-500">✓</span> 실시간 견적
            </span>
            <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-gray-100 text-gray-600 font-semibold
                             whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3.5 py-1.5 rounded-full border border-gray-200">
              <span className="text-red-500">✓</span> 24시간 접수
            </span>
            <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-gray-100 text-gray-600 font-semibold
                             whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3.5 py-1.5 rounded-full border border-gray-200">
              <span className="text-red-500">✓</span> 안전 운송
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-4 lg:mb-6 break-keep">
            화물운송이<br />
            <span className="text-red-600">간편해집니다</span>
          </h1>

          <p className="hidden lg:block text-lg md:text-xl text-gray-500 mb-6 lg:mb-10 leading-relaxed break-keep max-w-md">
            비용과 시간을 모두 아껴보세요.<br />
            퍼스트로드가 최적의 물류 솔루션을 제공합니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/estimatepage')}
              className="bg-red-600 text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-red-700 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(220,38,38,0.4)] transition-all duration-300"
            >
              지금 시작하기
            </button>
            <button
              onClick={() => navigate('/quick-search')}
              className="border-2 border-gray-200 text-gray-700 font-bold py-4 px-10 rounded-full text-lg hover:border-red-600 hover:text-red-600 transition-all duration-300 bg-white"
            >
              요금 간편조회
            </button>
          </div>
        </div>

        {/* 우측: 트럭 이미지 */}
        <div className="w-full lg:w-1/2 flex justify-center items-center order-1 lg:order-2 relative">
          {/* 트럭 접지 그림자(타원) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-10
                          bg-black/15 blur-2xl rounded-[50%] pointer-events-none" />

          <img
            src={truckImg}
            alt="퍼스트로드 트럭"
            className="relative z-10 w-full max-w-[300px] sm:max-w-[440px] lg:max-w-[660px] h-auto object-contain drop-shadow-2xl scale-x-[-1]"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
