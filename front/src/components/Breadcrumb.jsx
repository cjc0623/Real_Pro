import { Link } from 'react-router-dom';

/**
 * 공통 브레드크럼 컴포넌트
 * @param {string} label - 현재 페이지 이름 (예: "문의사항")
 *
 * 사용 예:
 *   <Breadcrumb label="문의사항" />
 *   → 홈 › 문의사항
 */
const Breadcrumb = ({ label }) => (
  <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 mb-6 sm:mb-10">
    <Link
      to="/"
      className="hover:text-gray-700 transition-colors flex items-center gap-1"
    >
      <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
      홈
    </Link>
    <span className="text-gray-300">›</span>
    <span className="text-gray-700 font-medium">{label}</span>
  </nav>
);

export default Breadcrumb;
