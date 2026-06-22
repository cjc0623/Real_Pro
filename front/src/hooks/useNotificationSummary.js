import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getNotificationSummary } from '../api/notificationApi';

/**
 * 역할별 "확인 필요" 알림 요약을 불러오는 공용 훅.
 * 헤더 통합 점 + 사이드바 메뉴 점에서 함께 사용한다.
 *
 * 반환:
 *  - hasAlert: 행동필요형 중 "마지막 확인 이후 새로 생긴" 항목이 있으면 true (헤더 통합 점)
 *  - items: { key: count } 항목별 건수
 *  - hasNew(key): 해당 항목이 마지막 본 건수보다 늘었는지 (메뉴 점 판단용)
 *  - markSeen(keys): 해당 항목을 "확인함" 처리(현재 건수를 저장) → 점 OFF, 즉시 반영
 *  - refresh: 수동 재조회
 *
 * 갱신: 로그인/계정 전환 시 + 60초 폴링 + 탭 포커스/가시성 복귀 시 재조회(§9.3).
 * read-state: localStorage `notifSeen:{loginId}:{key}` 스냅샷, 점 = 현재 > 마지막 본 건수(§9.2, 항목별).
 */

const POLL_MS = 60000; // 관리자 신고 뱃지 폴링(60초)과 통일
const SEEN_EVENT = 'notifSeenChanged'; // markSeen 시 헤더·사이드바 즉시 재계산용

function seenStorageKey(loginId, key) {
  return `notifSeen:${loginId || 'anon'}:${key}`;
}

// 토큰에서 실제 로그인 계정 식별자(sub/memId/cargoId)를 추출한다.
// redux memberId는 계정 전환 시 갱신이 늦어 stale일 수 있으므로, seen 네임스페이스·재조회는 토큰을 기준으로 한다.
function decodeTokenSub(token) {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(
      decodeURIComponent(
        atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      )
    );
    return payload.memId || payload.cargoId || payload.sub || null;
  } catch {
    return null;
  }
}

function readSeen(loginId, key) {
  try {
    const v = window.localStorage.getItem(seenStorageKey(loginId, key));
    return v == null ? 0 : Number(v) || 0;
  } catch {
    return 0;
  }
}

export default function useNotificationSummary() {
  const loginState = useSelector((state) => state?.login);
  // 인증의 source-of-truth는 토큰(로그인 시 navigate 전에 동기적으로 갱신됨).
  // 계정 식별자·재조회 트리거를 모두 토큰 기준으로 잡아 계정 전환 시 stale/혼선을 막는다.
  const accessToken = (typeof window !== 'undefined') ? sessionStorage.getItem('accessToken') : null;
  const loginId = decodeTokenSub(accessToken) || loginState?.memberId || null;
  const isLogin = Boolean(loginState?.email || loginState?.memberId || accessToken);

  const [items, setItems] = useState({});
  // markSeen 등으로 seen 스냅샷이 바뀌면 점 파생값을 다시 계산하기 위한 버전 카운터
  const [seenVersion, setSeenVersion] = useState(0);

  // 호출 시점의 토큰을 직접 읽어 항상 "현재 로그인 계정"의 데이터를 가져온다(closure stale 방지).
  const refresh = useCallback(async () => {
    const token = (typeof window !== 'undefined') ? sessionStorage.getItem('accessToken') : null;
    if (!token) { setItems({}); return; }
    try {
      const res = await getNotificationSummary();
      setItems(res?.items || {});
    } catch {
      setItems({}); // 알림은 부가 기능 — 실패해도 무시
    }
  }, []);

  // 로그인/계정 전환 시 재조회 (토큰/계정 식별자 변경 = 계정 전환을 감지)
  useEffect(() => {
    refresh();
  }, [refresh, accessToken, loginId]);

  // 로그인/로그아웃 명시 이벤트 → 무조건 재조회 (redux 재렌더 타이밍에 의존하지 않음).
  // 같은 브라우저에서 연달아 로그인해도 두 번째 계정으로 확실히 갱신된다.
  useEffect(() => {
    const onAuthChanged = () => { setItems({}); refresh(); };
    window.addEventListener('authChanged', onAuthChanged);
    return () => window.removeEventListener('authChanged', onAuthChanged);
  }, [refresh]);

  // §9.3 실시간 갱신: 60초 폴링 + 탭 포커스/가시성 복귀 시 재조회
  useEffect(() => {
    if (!isLogin) return undefined;
    const timer = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isLogin, refresh]);

  // §9.2 read-state: 다른 컴포넌트의 markSeen 호출 시 점 재계산
  useEffect(() => {
    const onSeen = () => setSeenVersion((v) => v + 1);
    window.addEventListener(SEEN_EVENT, onSeen);
    return () => window.removeEventListener(SEEN_EVENT, onSeen);
  }, []);

  // 처리되어 건수가 seen보다 줄면 watermark도 낮춘다.
  // (예: 직접요청 2건을 확인 후 모두 수락→0건, 이후 새 1건이 와도 점이 켜지도록)
  useEffect(() => {
    try {
      let changed = false;
      Object.keys(items || {}).forEach((key) => {
        const cur = Number(items[key]) || 0;
        if (cur < readSeen(loginId, key)) {
          window.localStorage.setItem(seenStorageKey(loginId, key), String(cur));
          changed = true;
        }
      });
      if (changed) setSeenVersion((v) => v + 1);
    } catch {
      // ignore
    }
  }, [items, loginId]);

  // 항목이 "마지막 본 건수"보다 늘었으면 새 알림 → 점 ON
  const hasNew = useCallback((key) => {
    const cur = Number(items?.[key]) || 0;
    return cur > readSeen(loginId, key);
    // seenVersion: markSeen 후 강제 재계산 트리거
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loginId, seenVersion]);

  // 확인 처리: 현재 건수를 seen으로 저장 → 점 OFF, 커스텀 이벤트로 즉시 반영
  const markSeen = useCallback((keys) => {
    const list = Array.isArray(keys) ? keys : [keys];
    try {
      list.forEach((key) => {
        const cur = Number(items?.[key]) || 0;
        window.localStorage.setItem(seenStorageKey(loginId, key), String(cur));
      });
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(SEEN_EVENT));
  }, [items, loginId]);

  // 헤더 통합 점: 행동필요형 중 "새로 생긴" 항목이 하나라도 있으면 ON
  const hasAlert = ACTION_KEYS.some((k) => hasNew(k));

  return { hasAlert, items, hasNew, markSeen, refresh };
}

// 알림 항목 key → 점을 표시할 대상의 "행동필요형 여부"
// (정보형 receivedReviews/approvedVehicles/deliveryCompleted 는 점 제외)
export const ACTION_KEYS = [
  'deliveryToStart',
  'pendingDirectRequests',
  'acceptedAwaitingPayment',
  'unreadReports',
  'unansweredInquiries',
  'pendingVehicleApprovals',
];
