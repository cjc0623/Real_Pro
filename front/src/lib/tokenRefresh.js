// 공용 액세스 토큰 재발급 코어.
// - 401 응답 시 refreshToken 으로 새 access/refresh 를 발급받아 원 요청을 1회 재시도한다.
// - 동시에 여러 요청이 401을 맞아도 재발급은 single-flight(한 번)로 처리한다.
// - 재발급 실패(리프레시 만료/폐기) 시 토큰을 정리하고 /login 으로 이동한다.
import axios from 'axios';
import { API_BASE } from '../config';

// 인터셉터가 없는 전용 인스턴스 — refresh 호출이 자기 자신을 다시 가로채는 무한루프 방지
const refreshClient = axios.create({ baseURL: API_BASE });

// refresh 를 시도하지 않을(=재시도 대상이 아닌) 인증 엔드포인트
const AUTH_SKIP = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'];
export const isAuthEndpoint = (url = '') => AUTH_SKIP.some((p) => url.includes(p));

let inflight = null; // single-flight 프로미스

function clearTokens() {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

function goLogin() {
  clearTokens();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login?error=session_expired');
  }
}

/**
 * refreshToken 으로 새 access 토큰을 발급받아 반환한다.
 * 동시 호출은 하나의 요청으로 합쳐진다(single-flight).
 * @returns {Promise<string>} 새 accessToken
 */
export function refreshAccessToken() {
  if (inflight) return inflight;

  const refreshToken = sessionStorage.getItem('refreshToken');
  if (!refreshToken) {
    goLogin();
    return Promise.reject(new Error('NO_REFRESH_TOKEN'));
  }

  inflight = refreshClient
    .post('/api/auth/refresh', { refreshToken })
    .then(({ data }) => {
      if (!data || !data.accessToken) throw new Error('NO_ACCESS_IN_REFRESH');
      sessionStorage.setItem('accessToken', data.accessToken);
      // 토큰 회전(rotation): 서버가 새 refresh 를 주면 함께 교체
      if (data.refreshToken) sessionStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    })
    .catch((err) => {
      goLogin();
      throw err;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/**
 * axios 인스턴스에 "401 → 재발급 → 1회 재시도" 응답 인터셉터를 등록한다.
 * @param {import('axios').AxiosInstance} instance
 */
export function attachRefreshInterceptor(instance) {
  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const response = error && error.response;
      const config = error && error.config;

      if (
        !response ||
        response.status !== 401 ||
        !config ||
        config._retried ||
        isAuthEndpoint(config.url || '')
      ) {
        return Promise.reject(error);
      }

      config._retried = true;
      try {
        const newToken = await refreshAccessToken();
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${newToken}`;
        return instance(config);
      } catch (e) {
        return Promise.reject(error);
      }
    }
  );
}
