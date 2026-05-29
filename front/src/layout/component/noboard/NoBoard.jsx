import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircularProgress, Alert, Pagination } from '@mui/material';

import { getNotices, getCategoryDisplayName } from '../../../api/noticeApi';
import { isCurrentUserAdmin } from '../../../utils/jwtUtils';

/* ── 카테고리별 원형 뱃지 색상 ──────────────────────────── */
const CATEGORY_COLOR = {
  ALL:     { bg: 'bg-gray-100',   text: 'text-gray-600'   },
  GENERAL: { bg: 'bg-green-100',  text: 'text-green-700'  },
  SYSTEM:  { bg: 'bg-purple-100', text: 'text-purple-700' },
  SERVICE: { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  UPDATE:  { bg: 'bg-red-100',    text: 'text-red-600'    },
};

const CategoryBadge = ({ category }) => {
  const name = getCategoryDisplayName(category);
  const { bg, text } = CATEGORY_COLOR[category] || CATEGORY_COLOR.ALL;
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold flex-shrink-0 whitespace-nowrap ${bg} ${text}`}
    >
      {name}
    </span>
  );
};

/* ── 메인 컴포넌트 ─────────────────────────────────────── */
const BulletinBoard = () => {
  const navigate = useNavigate();

  const [currentPage,    setCurrentPage]    = useState(0);
  const [notices,        setNotices]        = useState([]);
  const [totalElements,  setTotalElements]  = useState(0);
  const [totalPages,     setTotalPages]     = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isAdmin,        setIsAdmin]        = useState(false);

  const categories = [
    { id: 'ALL',     name: '전체'    },
    { id: 'GENERAL', name: '사용안내' },
    { id: 'SYSTEM',  name: '시스템'  },
    { id: 'SERVICE', name: '서비스'  },
    { id: 'UPDATE',  name: '업데이트' },
  ];

  const loadNotices = async (page = 0) => {
    try {
      setLoading(true);
      const params = { page, size: 10 };
      if (activeCategory && activeCategory !== 'ALL') params.category = activeCategory;
      const response = await getNotices(params);
      setNotices(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
      setError(null);
    } catch (err) {
      console.error('공지사항 로드 실패:', err);
      setError('공지사항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setIsAdmin(isCurrentUserAdmin()); }, []);
  useEffect(() => { loadNotices(currentPage); }, [currentPage, activeCategory]);

  const handlePageChange = (_, value) => setCurrentPage(value - 1);
  const handleRowClick   = (id)       => navigate(`/noboard/post/${id}`);
  const handleNewPost    = ()          => navigate('/noboard/write');

  const cleanTitle = (title = '') =>
    title
      .replace('[업데이트]', '').replace('[서비스]',   '')
      .replace('[시스템]',   '').replace('[사용안내]', '')
      .trim();

  return (
    /* ── 컨테이너: 모바일 px-4, 데스크탑 px-6 ── */
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 font-sans">

      {/* ── 브레드크럼 ── */}
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 mb-6 sm:mb-10">
        <Link to="/" className="hover:text-gray-700 transition-colors flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          홈
        </Link>
        <span className="text-gray-300">›</span>
        <span className="text-gray-700 font-medium">공지사항</span>
      </nav>

      {/* ── 페이지 제목: 모바일 text-2xl → 데스크탑 text-4xl ── */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-2 sm:mb-3">
          공지사항
        </h1>
        <p className="text-gray-400 text-xs sm:text-base">
          최신 업데이트와 중요한 안내사항을 확인하세요
        </p>
      </div>

      {/* ── 카테고리 탭 영역 ── */}
      <div className="border-b border-gray-200">

        {/* 탭 + 버튼: 한 줄 (탭 좌측 스크롤, 버튼 우측 고정) */}
        <div className="flex items-end">

          {/* 탭 목록: 가로 스크롤 + 스크롤바 숨김 */}
          <div className="flex flex-1 overflow-x-auto
                          [&::-webkit-scrollbar]:hidden
                          [-ms-overflow-style:none]
                          [scrollbar-width:none]">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setActiveCategory(cat.id); setCurrentPage(0); }}
                className={`
                  px-2.5 sm:px-5 py-2.5 sm:py-3
                  text-xs sm:text-sm font-medium
                  transition-colors border-b-2 whitespace-nowrap flex-shrink-0
                  ${activeCategory === cat.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 새 공지 작성: 모바일 아이콘만, 데스크탑 전체 텍스트 */}
          {isAdmin && (
            <button
              type="button"
              onClick={handleNewPost}
              className="flex-shrink-0 flex items-center gap-1 mb-2 ml-2
                         bg-gray-900 text-white font-semibold rounded-lg
                         px-2.5 py-2 sm:px-4 sm:py-2
                         text-xs sm:text-sm
                         hover:bg-gray-700 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {/* 모바일: 텍스트 숨김 / sm 이상: 표시 */}
              <span className="hidden sm:inline">새 공지 작성</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 공지사항 테이블 ── */}
      <div className="border border-gray-100 border-t-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[320px]">

          {/* 헤더 */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">

              {/* 번호: sm 미만 숨김 */}
              <th className="hidden sm:table-cell text-left px-3 sm:px-5 py-3 sm:py-4
                             text-xs font-semibold text-gray-400 uppercase tracking-wider w-14 sm:w-16">
                번호
              </th>

              {/* 분류: md 미만 숨김 */}
              <th className="hidden md:table-cell text-left px-3 py-3 sm:py-4
                             text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">
                분류
              </th>

              {/* 제목: 항상 표시 */}
              <th className="text-left px-3 sm:px-4 py-3 sm:py-4
                             text-xs font-semibold text-gray-400 uppercase tracking-wider">
                제목
              </th>

              {/* 작성자: md 미만 숨김 */}
              <th className="hidden md:table-cell text-left px-3 sm:px-5 py-3 sm:py-4
                             text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">
                작성자
              </th>

              {/* 작성일: 항상 표시 */}
              <th className="text-left px-3 sm:px-5 py-3 sm:py-4
                             text-xs font-semibold text-gray-400 uppercase tracking-wider w-24 sm:w-28">
                작성일
              </th>

            </tr>
          </thead>

          {/* 바디 */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-16 sm:py-20">
                  <CircularProgress size={22} />
                  <p className="text-gray-400 text-sm mt-3">로딩 중...</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="py-10 px-4 sm:px-6">
                  <Alert severity="error">{error}</Alert>
                </td>
              </tr>
            ) : notices.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 sm:py-20 text-gray-400 text-sm">
                  등록된 공지사항이 없습니다.
                </td>
              </tr>
            ) : (
              notices.map((notice, index) => {
                const virtualNumber = totalElements - (currentPage * 10) - index;
                return (
                  <tr
                    key={notice.noticeId}
                    onClick={() => handleRowClick(notice.noticeId)}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {/* 번호: sm 미만 숨김 */}
                    <td className="hidden sm:table-cell px-3 sm:px-5 py-4 sm:py-5 text-gray-400 text-xs sm:text-sm">
                      {virtualNumber}
                    </td>

                    {/* 분류: md 미만 숨김 */}
                    <td className="hidden md:table-cell px-3 py-4 sm:py-5 text-gray-500 text-xs sm:text-sm">
                      {getCategoryDisplayName(notice.category)}
                    </td>

                    {/* 제목: 항상 표시 */}
                    <td className="px-3 sm:px-4 py-4 sm:py-5">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                        <CategoryBadge category={notice.category} />
                        <span className="text-gray-800 font-medium text-xs sm:text-sm leading-snug break-keep">
                          {cleanTitle(notice.title)}
                        </span>
                      </div>
                    </td>

                    {/* 작성자: md 미만 숨김 */}
                    <td className="hidden md:table-cell px-3 sm:px-5 py-4 sm:py-5 text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                      {notice.authorName}
                    </td>

                    {/* 작성일: 항상 표시 */}
                    <td className="px-3 sm:px-5 py-4 sm:py-5 text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                      {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── 페이지네이션 ── */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 sm:mt-8">
          <Pagination
            count={totalPages}
            page={currentPage + 1}
            onChange={handlePageChange}
            color="primary"
            size="medium"
            showFirstButton
            showLastButton
          />
        </div>
      )}

    </div>
  );
};

export default BulletinBoard;
