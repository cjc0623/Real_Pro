import axios from "axios";
import { API_SERVER_HOST } from "./serverConfig";

const prefix = `${API_SERVER_HOST}/fr/notifications`;

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}`,
});

// 헤더 아바타 알림 뱃지용 — 역할별 "확인 필요" 요약
// 응답: { total, role, items: { ... } }
export const getNotificationSummary = async () => {
  const res = await axios.get(`${prefix}/summary`, {
    headers: authHeaders(),
    withCredentials: true,
  });
  return res.data;
};
