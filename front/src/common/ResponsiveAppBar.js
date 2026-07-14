import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUserInfoAsync, login as loginAction, logout as logoutAction } from "../slice/loginSlice";
import logo from "../assets/logo.png";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

const navItems = [
  { label: "이용가이드", path: "/guide" },
  { label: "간편조회", path: "/quick-search" },
  { label: "온라인 퀵 접수", path: "/estimatepage" },
  { label: "운송 접수 목록", path: "/estimatepage/list" },
  { label: "공지사항", path: "/noboard" },
  { label: "문의사항", path: "/qaboard" },
];

const pickToken = () =>
  sessionStorage.getItem("accessToken") || sessionStorage.getItem("ACCESS_TOKEN") || null;

function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function ResponsiveAppBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [homeHeaderTone, setHomeHeaderTone] = useState("dark");
  const isHomePage = pathname === "/";
  const useLightHomeHeader = isHomePage && homeHeaderTone === "light";
  const homeTextClass = useLightHomeHeader
    ? "text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.52)]"
    : "text-[#121826]";
  const homeDividerClass = useLightHomeHeader ? "bg-white/60" : "bg-[#d7dde7]";
  const homeMenuLineClass = useLightHomeHeader ? "bg-white" : "bg-[#172033]";

  const loginState = useSelector((state) => state?.login || {});
  const accessToken = typeof window !== "undefined" ? pickToken() : null;
  const isLogin = Boolean(loginState?.email || loginState?.memberId || accessToken);
  const roles = Array.isArray(loginState?.roles)
    ? loginState.roles
    : loginState?.roles
      ? [loginState.roles]
      : [];
  const isAdmin = roles.includes("ROLE_ADMIN");
  const myPagePath = isAdmin ? "/admin" : "/mypage";
  const displayUserName = loginState?.memberId || loginState?.nickname || loginState?.email || "마이페이지";

  useEffect(() => {
    const token = pickToken();
    if (!token || loginState?.email || loginState?.memberId) return;

    const payload = decodeJwt(token);
    if (!payload) return;

    dispatch(
      loginAction({
        email: payload.email || payload.memEmail || "",
        nickname: payload.name || "",
        roles: payload.roles || payload.rolenames || ["USER"],
        memberId: payload.memId || payload.cargoId || payload.sub || null,
      })
    );
    dispatch(getUserInfoAsync());
  }, [dispatch, loginState?.email, loginState?.memberId]);

  useEffect(() => {
    if (!isHomePage) return undefined;

    const syncHomeState = () => {
      const probeX = Math.min(Math.max(window.innerWidth / 2, 24), window.innerWidth - 24);
      const probeY = 48;
      const toneElement = document
        .elementsFromPoint(probeX, probeY)
        .find((element) => !element.closest("header") && element.closest("[data-header-tone]"))
        ?.closest("[data-header-tone]");

      setHomeHeaderTone(toneElement?.dataset.headerTone || "dark");
    };

    syncHomeState();
    window.addEventListener("firstroad-home-mode", syncHomeState);
    window.addEventListener("scroll", syncHomeState, { passive: true });
    window.addEventListener("resize", syncHomeState);
    return () => {
      window.removeEventListener("firstroad-home-mode", syncHomeState);
      window.removeEventListener("scroll", syncHomeState);
      window.removeEventListener("resize", syncHomeState);
    };
  }, [isHomePage]);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");

      try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: "POST" });
      } catch {
        // Local logout should still continue when the server is unavailable.
      }

      dispatch(logoutAction());
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <header
      className={
        isHomePage
          ? "fixed inset-x-0 top-0 z-50 w-full bg-transparent px-3 py-3 font-sans text-[#121826] sm:px-5 lg:px-6"
          : "sticky top-0 z-50 w-full bg-white/92 font-sans text-[#121826] shadow-[0_8px_28px_rgba(15,23,42,0.045)] backdrop-blur-xl"
      }
    >
      <div className={isHomePage ? "mx-auto w-full max-w-[1920px]" : "mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-10"}>
        <div className={isHomePage ? "flex items-start justify-between gap-2 sm:gap-3" : "flex h-16 items-center justify-between gap-4 lg:h-20"}>
          <Link
            to="/"
            className={
              isHomePage
                ? "flex min-w-0 flex-shrink-0 items-center px-1 py-1 sm:px-2"
                : "flex min-w-0 flex-shrink-0 items-center"
            }
            aria-label="퍼스트로드 홈"
          >
            <img
              className={
                isHomePage
                  ? `h-auto w-28 object-contain sm:w-36 lg:w-40 ${useLightHomeHeader ? "brightness-0 invert drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]" : ""}`
                  : "h-auto w-32 object-contain sm:w-36 lg:w-52"
              }
              src={logo}
              alt="퍼스트로드"
            />
          </Link>

          <nav
            className={
              isHomePage
                ? `hidden items-center gap-7 px-6 py-4 lg:flex ${homeTextClass}`
                : "hidden items-center gap-7 lg:flex"
            }
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`whitespace-nowrap text-[15px] font-extrabold tracking-[-0.02em] transition-colors hover:text-[#e52424] ${
                  isHomePage ? "" : "text-[#1f2937]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div
            className={
              isHomePage
                ? `flex items-center gap-2 px-1 py-1 text-sm font-extrabold sm:gap-3 sm:px-2 sm:py-2 lg:text-[15px] ${homeTextClass}`
                : "flex items-center gap-3 text-sm font-extrabold text-[#172033] lg:text-[15px]"
            }
          >
            {isLogin ? (
              <>
                <Link to={myPagePath} className="hidden transition-colors hover:text-[#e52424] sm:inline-flex">
                  {displayUserName}
                </Link>
                <span className={`hidden h-4 w-px sm:block ${isHomePage ? homeDividerClass : "bg-[#d7dde7]"}`} />
                <button type="button" onClick={handleLogout} className="transition-colors hover:text-[#e52424]">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="transition-colors hover:text-[#e52424]">
                  로그인
                </Link>
                <span className={`h-4 w-px ${isHomePage ? homeDividerClass : "bg-[#d7dde7]"}`} />
                <Link to="/signup" className="transition-colors hover:text-[#e52424]">
                  회원가입
                </Link>
              </>
            )}

            <button
              type="button"
              className={
                isHomePage
                  ? "ml-1 flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-xl transition lg:hidden"
                  : "ml-1 flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition lg:hidden"
              }
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="메뉴 열기"
              aria-expanded={menuOpen}
            >
              <span className={`block h-[2px] w-[20px] rounded transition ${isHomePage ? homeMenuLineClass : "bg-[#172033]"} ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`block h-[2px] w-[20px] rounded transition ${isHomePage ? homeMenuLineClass : "bg-[#172033]"} ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-[2px] w-[20px] rounded transition ${isHomePage ? homeMenuLineClass : "bg-[#172033]"} ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav
          className={
            isHomePage
              ? `mx-3 mt-2 rounded-[1.4rem] px-2 py-2 backdrop-blur-sm sm:mx-5 lg:hidden ${
                  useLightHomeHeader ? "bg-[#0b1019]/72 text-white" : "bg-white/80 text-[#121826]"
                }`
              : "bg-white/95 shadow-[0_14px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl lg:hidden"
          }
        >
          <div className="grid px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`rounded-2xl px-4 py-3 text-base font-black transition hover:text-[#e52424] ${
                  isHomePage
                    ? useLightHomeHeader
                      ? "text-white hover:bg-white/10"
                      : "text-[#1f2937] hover:bg-white/60"
                    : "text-[#1f2937] hover:bg-[#f7f8fa]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
