import React from 'react';
import { useNavigate } from "react-router-dom";
import truckImg from '../assets/25truck.png';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative w-full bg-white overflow-hidden font-sans">

      {/* ── 메인 히어로 ── */}
      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center min-h-[88vh] py-16 gap-8">

        {/* 좌측: 텍스트 */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center order-2 lg:order-1 py-8">
          <p className="text-red-600 font-bold text-sm tracking-[0.2em] uppercase mb-5">
            First Road Platform
          </p>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-6 break-keep">
            화물운송이<br />
            <span className="text-red-600">간편해집니다</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 mb-10 leading-relaxed break-keep max-w-md">
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
          <img
            src={truckImg}
            alt="퍼스트로드 트럭"
            className="relative z-10 w-full max-w-[660px] h-auto object-contain drop-shadow-2xl scale-x-[-1]"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
