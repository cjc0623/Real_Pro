import React, { useState } from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

const actions = [
  { label: "가이드", path: "/guide", icon: MenuBookIcon },
  { label: "상담사", path: "/servicecenterpage", icon: ChatBubbleOutlineIcon },
  { label: "AI상담", path: "/servicecenterpage", icon: SmartToyOutlinedIcon },
];

export default function FloatingButtons() {
  const [open, setOpen] = useState(false);

  const goTo = (path) => {
    setOpen(false);
    window.location.href = path;
  };

  return (
    <div className="no-print fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3 sm:bottom-7 sm:right-7">
      <div
        className={`grid gap-2 transition-all duration-200 ${
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        {actions.map(({ label, path, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => goTo(path)}
            className="group flex min-w-[132px] items-center justify-between gap-3 rounded-full border border-[#e7ebf2] bg-white/95 px-4 py-3 text-sm font-black text-[#172033] shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl transition hover:border-[#ef4444] hover:text-[#e52424]"
          >
            <span>{label}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f4f6f8] text-[#e52424] transition group-hover:bg-[#fee2e2]">
              <Icon sx={{ fontSize: 18 }} />
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="grid h-[52px] w-[52px] place-items-center rounded-full border border-white/80 bg-[#172033] text-white shadow-[0_18px_36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-[#e52424] sm:h-14 sm:w-14"
        aria-label={open ? "빠른 메뉴 닫기" : "빠른 메뉴 열기"}
        aria-expanded={open}
      >
        {open ? <CloseIcon sx={{ fontSize: 23 }} /> : <MoreHorizIcon sx={{ fontSize: 28 }} />}
      </button>

      <div className="hidden items-center gap-1 rounded-full bg-white/88 px-3 py-1.5 text-[11px] font-black text-[#6b7280] shadow-sm backdrop-blur sm:flex">
        <AutoAwesomeIcon sx={{ fontSize: 14, color: "#e52424" }} />
        빠른 메뉴
      </div>
    </div>
  );
}
