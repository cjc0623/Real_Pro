// 전역 HTTP 설정: 모든 요청(axios + fetch)에 JWT 자동 부착.
// 백엔드 인가 강화 후, 프론트의 3가지 호출 패턴(axios.create 인스턴스 / bare axios / fetch)을 모두 커버.
// 토큰 유출 방지: 우리 백엔드(API_BASE)로 가는 요청에만 부착.
import axios from 'axios';
import { API_BASE } from '../config';
import { attachRefreshInterceptor, refreshAccessToken, isAuthEndpoint } from '../lib/tokenRefresh';

const getToken = () => sessionStorage.getItem('accessToken');
const isOwnApi = (url = '') => url.startsWith(API_BASE) || url.startsWith('/');

// 1) bare axios 호출용 (axios.create 인스턴스는 각자 인터셉터가 있거나 별도)
axios.interceptors.request.use((config) => {
  if (isOwnApi(config.url || '')) {
    const token = getToken();
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 1-1) 전역 axios 응답: 401 → 리프레시 재발급 → 원 요청 1회 재시도
attachRefreshInterceptor(axios);

// 2) fetch 호출용 (adminMembersApi 등 fetch 기반 모듈 커버)
if (typeof window !== 'undefined' && window.fetch && !window.__fetchAuthPatched) {
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const isOurs = url.startsWith(API_BASE);
    if (isOurs) {
      const token = getToken();
      if (token) {
        const headers = new Headers((init && init.headers) || (typeof input !== 'string' && input.headers) || {});
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
        init = { ...init, headers };
      }
    }

    let res = await origFetch(input, init);

    // 2-1) 401 → 리프레시 재발급 → 새 토큰으로 1회 재시도
    if (isOurs && res.status === 401 && !init.__retried && !isAuthEndpoint(url)) {
      try {
        const newToken = await refreshAccessToken();
        const headers = new Headers((init && init.headers) || {});
        headers.set('Authorization', `Bearer ${newToken}`);
        init = { ...init, headers, __retried: true };
        res = await origFetch(input, init);
      } catch (_) {
        // 재발급 실패 시 원 401 응답을 그대로 반환 (refreshAccessToken 이 로그인 이동 처리)
      }
    }
    return res;
  };
  window.__fetchAuthPatched = true;
}

export default axios;
