import axios from "axios";
import { API_SERVER_HOST } from "../serverConfig";

const prefix = `${API_SERVER_HOST}/g2i4/estimate`;

const authHeader = () => {
  const accessToken = sessionStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
};

// 화주: 차주 탐색 목록 (평점/리뷰수 요약 포함)
export const getDrivers = async ({ keyword = "", requireVehicle = true } = {}) => {
  const res = await axios.get(`${prefix}/drivers`, {
    params: { keyword: keyword || undefined, requireVehicle },
    headers: authHeader(),
  });
  return res.data; // List<DriverProfileCardDTO>
};

// 화주: 직접요청 생성 (견적 신규작성 + 지정 차주). estimateDTO 본문 + cargoId 쿼리
export const postDirectRequest = async (estimateDTO, cargoIds) => {
  const res = await axios.post(
    `${prefix}/direct-request`,
    { estimate: estimateDTO, cargoIds }, // 견적 1개 + 차주 N명 팬아웃
    { headers: authHeader() }
  );
  return res.data; // { requestIds: [...] }
};

// 화주: 내가 보낸 직접요청 목록
export const getSentDirectRequests = async () => {
  const res = await axios.get(`${prefix}/direct-requests/sent`, {
    headers: authHeader(),
  });
  return res.data; // List<DirectRequestDTO>
};

// 차주: 나에게 온 직접요청 목록
export const getReceivedDirectRequests = async () => {
  const res = await axios.get(`${prefix}/direct-requests/received`, {
    headers: authHeader(),
  });
  return res.data; // List<DirectRequestDTO>
};

// 차주: 직접요청 수락 (수락 시 Matching 승격 → { matchingNo } 반환)
export const acceptDirectRequest = async (requestId) => {
  const res = await axios.post(`${prefix}/direct-request/${requestId}/accept`, null, {
    headers: authHeader(),
  });
  return res.data;
};

// 차주: 직접요청 거절
export const rejectDirectRequest = async (requestId) => {
  const res = await axios.post(`${prefix}/direct-request/${requestId}/reject`, null, {
    headers: authHeader(),
  });
  return res.data;
};

// 화주: 직접요청 1건 취소 (응답 대기 상태만)
export const cancelDirectRequest = async (requestId) => {
  const res = await axios.post(`${prefix}/direct-request/${requestId}/cancel`, null, {
    headers: authHeader(),
  });
  return res.data;
};

// 화주: 한 견적(배송)의 대기 중 직접요청 전체 취소
export const cancelDirectRequestGroup = async (eno) => {
  const res = await axios.post(`${prefix}/direct-requests/group/${eno}/cancel`, null, {
    headers: authHeader(),
  });
  return res.data; // { result, count }
};
