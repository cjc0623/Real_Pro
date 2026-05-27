import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import Breadcrumb from '../components/Breadcrumb';

const guideData = {
  '시작하기': [
    { title: '기본 운송이란?', content: '차량만 대여하는 서비스로, 고객님께서 직접 화물의 상/하차를 해주셔야 합니다.' },
    { title: '상하차 도움이란?', content: '기사님이 차량 옆에서 화물을 싣고 내리는 작업을 함께 도와드리는 서비스입니다.' },
    { title: '상하차 + 인부 1명이란?', content: '기사님 외에 전문 인력이 추가 투입되어, 출발지부터 도착지까지 모든 운반 과정을 책임집니다.' },
  ],
  '요금안내': [
    { title: '1. 차종별 기본 운임', content: '차종(중량)에 따른 기본 요금 및 거리당 단가표입니다.', isTable: true, tableType: 'basic' },
    { title: '2. 장거리 운송 자동 할인 혜택', content: '주행 거리에 따라 적용되는 자동 할인율 안내입니다.', isTable: true, tableType: 'discount' },
    { title: '3. 부가 서비스 요금', content: '상하차 방식에 따른 추가 옵션 요금표입니다.', isTable: true, tableType: 'extra' }
  ],
  'FAQ': [
    { title: '회원가입을 해야되나요?', content: '네, 원활한 서비스 이용과 이용 내역 관리를 위해 회원가입이 필요합니다.' },
    { title: '운송요금이 궁금합니다.', content: '거리, 차량 종류, 상하차 옵션에 따라 요금이 책정됩니다. 메인 페이지의 견적 조회를 이용해 주세요.' },
    { title: '기사님 배차는 언제 되나요?', content: '접수 완료 후 평균 10~30분 이내에 근거리 기사님이 배정됩니다.' },
  ],
  '기본정보': [
    { title: '운송과 운반의 차이는 무엇인가요?', content: '운송은 차량으로 물건을 이동하는 것이며, 운반은 사람이 직접 물건을 나르는 행위를 포함합니다.' },
    { title: '월 거래 계약이란?', content: '정기적인 물류 배송이 필요한 기업 고객을 위한 맞춤형 월 단위 계약 서비스입니다.' },
  ]
};

const GuidePage = () => {
  const [activeTab, setActiveTab] = useState('시작하기');
  const [expandedItem, setExpandedItem] = useState(null);

  const handleToggle = (index) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const renderTable = (type) => {
    if (type === 'basic') {
      return (
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f3f4f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>적재 중량</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>기본 요금</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>km당 단가</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                ['0.5톤 차량', '25,000원', '800원'],
                ['1톤 차량', '45,000원', '1,000원'],
                ['2톤 차량', '80,000원', '1,400원'],
                ['3톤 차량', '110,000원', '1,800원'],
                ['4톤 차량', '150,000원', '2,200원'],
                ['5톤 차량', '200,000원', '2,800원'],
                ['5톤 이상', '300,000원', '3,500원']
              ].map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row[0]}</TableCell>
                  <TableCell>{row[1]}</TableCell>
                  <TableCell>{row[2]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    if (type === 'discount') {
      return (
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f3f4f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>주행 거리</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>할인율</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>비고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                ['100km 이상', '5%', '자동 차감'],
                ['200km 이상', '10%', '자동 차감'],
                ['300km 이상', '15%', '자동 차감'],
                ['400km 이상', '20%', '최대 할인']
              ].map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row[0]}</TableCell>
                  <TableCell sx={{ color: '#d32f2f', fontWeight: 'bold' }}>{row[1]}</TableCell>
                  <TableCell>{row[2]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    if (type === 'extra') {
      return (
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f3f4f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>서비스 항목</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>추가 요금</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>상세 내용</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                ['상하차 도움', '50,000원', '기사님 작업 지원'],
                ['상하차 + 인부 1명', '85,000원', '전문 인력 추가 투입']
              ].map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row[0]}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{row[1]}</TableCell>
                  <TableCell>{row[2]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── 브레드크럼 ── */}
        <Breadcrumb label="이용가이드" />

        {/* ── 제목 — 중앙 정렬 ── */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-2 sm:mb-3">
            이용가이드
          </h1>
          <p className="text-gray-400 text-xs sm:text-base break-keep">
            퍼스트로드 용달 서비스를 더 편리하게 이용하는 방법을 안내합니다
          </p>
        </div>

        {/* ── 탭 — 언더라인 스타일 (공지사항·고객지원과 동일) ── */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex overflow-x-auto
                          [&::-webkit-scrollbar]:hidden
                          [-ms-overflow-style:none]
                          [scrollbar-width:none]">
            {Object.keys(guideData).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setExpandedItem(null); }}
                className={`
                  px-4 sm:px-6 py-2.5 sm:py-3
                  text-xs sm:text-sm font-medium
                  border-b-2 -mb-px transition-all whitespace-nowrap flex-shrink-0
                  ${activeTab === tab
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── 아코디언 목록 — 고객지원 스타일과 동일 ── */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          {guideData[activeTab].map((item, index) => (
            <div key={index} className="border-b border-gray-100 last:border-b-0">

              {/* 헤더 버튼 */}
              <button
                type="button"
                onClick={() => handleToggle(index)}
                className={`
                  w-full flex items-center justify-between
                  px-4 sm:px-6 py-4 sm:py-5
                  text-left cursor-pointer transition-colors duration-150
                  ${expandedItem === index ? 'bg-gray-50/70' : 'bg-white hover:bg-gray-50'}
                `}
              >
                <span className="text-sm sm:text-base font-semibold text-gray-800 leading-snug break-keep pr-3">
                  {item.title}
                </span>
                <ExpandMore
                  sx={{
                    flexShrink: 0,
                    color: '#9ca3af',
                    transform: expandedItem === index ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                />
              </button>

              {/* 펼쳐진 내용 */}
              {expandedItem === index && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  {item.isTable ? (
                    renderTable(item.tableType)
                  ) : (
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-keep">
                      {item.content}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default GuidePage;