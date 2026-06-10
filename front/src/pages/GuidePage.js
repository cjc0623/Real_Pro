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
  '서비스 안내': [
    { title: '이용 절차', content: '1. 간편조회 및 운송 접수\n2. 최적의 기사님 배차 (일반 배차 또는 차주 직접 지정)\n3. 출발지 픽업 및 실시간 배송 진행\n4. 도착지 하차 및 운송 완료' },
    { title: '운송 방식 선택 (상하차)', content: '• 기본 운송: 차량만 지원하며, 고객님이 직접 상하차를 진행합니다.\n• 상하차 도움: 기사님이 상하차 작업을 함께 도와드립니다.\n• 상하차 + 인부 추가: 무거운 짐을 위해 기사님 외 전문 인력이 추가 투입됩니다.' },
    { title: '지정 배차 (직접 요청) 서비스', content: '마이페이지에서 이전에 이용했던 우수 기사님이나 원하는 평점의 기사님을 직접 지정하여 배차를 요청할 수 있는 프리미엄 기능입니다.' },
    { title: '월 거래 (기업 물류)', content: '정기적인 물류 배송이 필요한 기업/사업자 고객을 위해 세금계산서 발행 및 맞춤형 월 단위 결제 계약을 제공합니다.' },
  ],
  '차량 안내': [
    { title: '퀵 서비스 차량', content: '• 오토바이 퀵: 서류, 소형 박스 등 빠르고 신속한 근거리 배송\n• 다마스 용달: 1인 가구 이사, 오토바이로 싣기 어려운 소형 화물 배송' },
    { title: '일반 화물 트럭', content: '• 1톤 ~ 5톤: 중소형 화물 및 원룸 이사\n• 11톤 ~ 25톤: 대형 화물, 공장 간 대량 물류 이동' },
    { title: '특수 화물 차량', content: '• 탑차: 비/눈 등 날씨 영향이 없는 폐쇄형 적재함\n• 윙바디: 양 측면이 열려 지게차 팔레트 상하차가 용이한 차량\n• 리프트: 무거운 짐을 쉽게 올릴 수 있는 파워게이트 장착 차량\n• 냉동차: 신선식품 및 콜드체인 운송' },
    { title: '차량별 적재 규격 (참고용)', content: '• 다마스: 가로 1.1m x 세로 1.1m x 높이 1.1m (최대 300kg)\n• 1톤 카고: 가로 1.6m x 세로 2.8m (최대 1,000kg)\n• 5톤 카고: 가로 2.3m x 세로 6.2m (최대 5,000kg)\n※ 차량 연식 및 특장 개조 여부에 따라 실제 적재 공간은 다소 차이가 있을 수 있습니다.' },
    { title: '운송 제한 및 취급 불가 품목', content: '현금, 유가증권, 귀금속, 인화성/폭발성 위험 물질, 마약류 및 불법 무기류, 살아있는 동식물 등은 관련 법령 및 당사 안전 규정에 따라 운송 접수가 엄격히 제한됩니다.' }
  ],
  '요금 및 결제': [
    { title: '요금 산정 방식', content: '배송 요금은 [차량 톤수별 기본 요금 + 주행 거리에 따른 km당 단가]로 자동 산정되며, 상하차 방식 및 급송 옵션 선택 시 요금이 추가될 수 있습니다.' },
    { title: '1. 부가 서비스 옵션', content: '기본 운송 외에 추가로 선택할 수 있는 상하차 지원 서비스 요금표입니다.', isTable: true, tableType: 'extra' },
    { title: '2. 장거리 자동 할인 혜택', content: '주행 거리에 따라 자동으로 차감 적용되는 장거리 할인 구간입니다.', isTable: true, tableType: 'discount' },
    { title: '통행료 및 할증 안내', content: '• 고속도로 통행료: 기본 운임에 포함되지 않으며, 발생 시 실비로 정산됩니다.\n• 기상 및 야간 할증: 심야 시간대(22시~06시) 또는 폭설, 폭우 등 기상 악화 시에는 소정의 할증 요금이 부과될 수 있습니다.' },
    { title: '결제 방식 안내', content: '현금 선불, 현금 착불, 신용카드 결제를 모두 지원합니다. 주문 접수 단계에서 원하시는 방식을 선택할 수 있습니다.' },
    { title: '취소 및 환불 규정', content: '주문 접수 직후 기사님 배정 전 취소는 100% 무료입니다. 단, 기사님이 이미 배정되어 출발지로 이동 중이거나 픽업지에 도착한 이후 취소할 경우에는 소정의 회차 비용(수수료)이 발생합니다.' }
  ],
  '자주 묻는 질문(FAQ)': [
    { title: '회원가입을 꼭 해야 하나요?', content: '비회원도 간편조회를 통해 요금을 확인하실 수는 있지만, 실제 견적 접수와 실시간 배송 현황 확인, 내역 관리를 위해서는 회원가입이 필수입니다.' },
    { title: '예상 운송 요금은 어떻게 확인하나요?', content: '간편조회 페이지에서 출발지, 도착지 주소와 화물 무게를 입력하시면 거리를 자동 계산하여 예상 요금을 즉시 알려드립니다.' },
    { title: '기사님 배차는 얼마나 걸리나요?', content: '접수 완료 후 평균 10~30분 이내에 가장 가까운 거리의 기사님이 자동으로 배정됩니다. 기상 악화나 특정 시간대에는 다소 지연될 수 있습니다.' },
    { title: '운송 도중 목적지를 변경하거나 경유지를 추가할 수 있나요?', content: '네, 가능합니다. 단, 추가 이동 거리가 늘어나는 경우 요금이 재산정되며 기사님께 직접 현장에서 추가 운임을 지불하시거나 고객센터를 통해 조율하셔야 합니다.' },
    { title: '세금계산서나 현금영수증 발행이 가능한가요?', content: '기업 및 개인 사업자 고객님은 운송 완료 후 마이페이지 내 [결제 내역] 메뉴에서 사업자등록증 정보를 입력하여 전자 세금계산서 또는 지출증빙용 현금영수증 발행을 즉시 신청하실 수 있습니다.' },
    { title: '고객센터 운영시간과 문의 방법은?', content: '고객센터는 평일 09:00 ~ 18:00에 운영됩니다. 홈페이지 우측 하단의 실시간 AI 챗봇을 이용하시면 시간 제약 없이 빠른 답변을 받으실 수 있습니다.' }
  ]
};

const GuidePage = () => {
  const [activeTab, setActiveTab] = useState('서비스 안내');
  const [expandedItem, setExpandedItem] = useState(null);

  const handleToggle = (index) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const renderTable = (type) => {
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