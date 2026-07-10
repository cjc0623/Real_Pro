/**
 * JWT 토큰 관련 유틸리티 함수들
 */

/**
 * JWT 토큰을 디코딩하여 페이로드를 반환
 * @param {string} token - JWT 토큰
 * @returns {object|null} - 디코딩된 페이로드 또는 null
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    // JWT는 header.payload.signature 형태
    const payload = token.split('.')[1];
    if (!payload) return null;
    
    // Base64 URL 디코딩
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('JWT 토큰 디코딩 실패:', error);
    return null;
  }
};

/**
 * 현재 사용자의 JWT 토큰에서 정보 추출
 * @returns {object|null} - 사용자 정보 또는 null
 */
export const getCurrentUserInfo = () => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) return null;
  
  const payload = decodeToken(token);
  if (!payload) return null;
  
  return {
    authorId: payload.sub || null,
    roles: payload.roles || [],
    email: payload.email || null,
    isAdmin: payload.roles && payload.roles.some(role => 
      role.toLowerCase().includes('admin') || 
      role === 'ROLE_ADMIN'
    )
  };
};

/**
 * 현재 사용자가 관리자인지 확인
 * @returns {boolean} - 관리자 여부
 */
export const isCurrentUserAdmin = () => {
  const userInfo = getCurrentUserInfo();
  return userInfo ? userInfo.isAdmin : false;
};

/**
 * 현재 사용자의 ID 반환
 * @returns {string|null} - 사용자 ID 또는 null
 */
export const getCurrentUserId = () => {
  const userInfo = getCurrentUserInfo();
  return userInfo ? userInfo.authorId : null;
};

/**
 * JWT 토큰이 유효한지 확인 (만료 시간 체크)
 * @returns {boolean} - 유효성 여부
 */
export const isTokenValid = () => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) return false;
  
  const payload = decodeToken(token);
  if (!payload) return false;
  
  // exp 클레임은 초 단위이므로 1000을 곱해서 밀리초로 변환
  const currentTime = Date.now() / 1000;
  return payload.exp && payload.exp > currentTime;
};

/**
 * 사용자가 로그인되어 있는지 확인
 * @returns {boolean} - 로그인 여부
 */
export const isUserLoggedIn = () => {
  return isTokenValid();
};

/**
 * 전달된 JWT 문자열이 만료되었는지 확인 (exp 클레임 기준)
 * - 디코딩 실패 / exp 없음 → 만료로 간주(안전측)
 * @param {string} token - JWT 토큰
 * @returns {boolean} - 만료 여부
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  // exp 클레임은 초 단위 → 현재 시각(초)과 비교
  return Date.now() / 1000 >= payload.exp;
};

/**
 * 앱 시작 시 1회 호출: 액세스 토큰이 만료됐으면 세션을 완전히 정리한다.
 * "만료 = 로그아웃" 정책이므로 리프레시 토큰도 함께 제거하여 자동 재로그인을 막는다.
 * → 새로고침 시 만료된 토큰이 남아 로그인 상태로 잘못 표시되던 문제 방지.
 * @returns {boolean} - 정리(로그아웃)했으면 true
 */
export const purgeExpiredTokens = () => {
  const token = sessionStorage.getItem('accessToken');
  if (token && isTokenExpired(token)) {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('ACCESS_TOKEN');
    return true;
  }
  return false;
};