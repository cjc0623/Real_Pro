// 전역 HTTP 설정: 모든 요청(axios + fetch)에 JWT 자동 부착.
// 백엔드 인가 강화 후, 프론트의 3가지 호출 패턴(axios.create 인스턴스 / bare axios / fetch)을 모두 커버.
// 토큰 유출 방지: 우리 백엔드(API_BASE)로 가는 요청에만 부착.
import axios from 'axios';
import { API_BASE } from '../config';

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

// 2) fetch 호출용 (adminMembersApi 등 fetch 기반 모듈 커버)
if (typeof window !== 'undefined' && window.fetch && !window.__fetchAuthPatched) {
  const origFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.startsWith(API_BASE)) {
      const token = getToken();
      if (token) {
        const headers = new Headers((init && init.headers) || (typeof input !== 'string' && input.headers) || {});
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
        init = { ...init, headers };
      }
    }
    return origFetch(input, init);
  };
  window.__fetchAuthPatched = true;
}

export default axios;
