import { useEffect } from "react";
import { Box } from "@mui/material";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const EstimatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 페이지 진입·경로 변경(탭 전환) 시 항상 최상단부터 보이도록 스크롤 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  const getTabValue = () => {
    if (location.pathname.endsWith("/list")) return 1;
    return 0;
  };

  const handleTabChange = (e, newValue) => {
    if (newValue === 0) navigate("");
    if (newValue === 1) navigate("list");
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-50 font-sans pt-6">

      {/* ── 탭 — 언더라인 스타일 ── */}
      <div className="w-full max-w-[1200px] px-4 sm:px-6 mb-4">
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { label: "견적서 작성", val: 0 },
              { label: "운송 접수 사항", val: 1 },
            ].map(({ label, val }) => (
              <button
                key={val}
                type="button"
                onClick={() => handleTabChange(null, val)}
                className={`
                  px-5 py-3 text-sm font-semibold
                  border-b-2 -mb-px transition-all whitespace-nowrap
                  ${getTabValue() === val
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 콘텐츠 ── */}
      <div className="w-full max-w-[1200px] px-4 sm:px-6 pb-12">
        <Outlet />
      </div>
    </div>
  );
};

export default EstimatePage;
