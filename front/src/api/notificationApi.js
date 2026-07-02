import axios from "axios";
import { API_SERVER_HOST } from "./serverConfig";

const prefix = `${API_SERVER_HOST}/fr/notifications`;

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}`,
});

// 헤더 아바타 알림 뱃지용 — 역할별 "확인 필요" 요약
// 응답: { total, role, items: { ... } }
export const getNotificationSummary = async () => {
  // withCredentials 미사용: 쿠키 세션(직전 로그인 계정)이 Bearer 토큰을 덮어쓰는 것을 막는다.
  // 알림 인증은 Authorization 헤더(JWT)만으로 충분하며, 쿠키를 보내면 연속 로그인 시 계정이 섞인다.
  const res = await axios.get(`${prefix}/summary`, {
    headers: authHeaders(),
  });
  return res.data;
};
