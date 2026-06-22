import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getNotificationSummary } from '../api/notificationApi';

/**
 * 역할별 "확인 필요" 알림 요약을 불러오는 공용 훅.
 * 헤더 통합 점 + 사이드바 메뉴 점에서 함께 사용한다.
 *
 * 반환:
 *  - hasAlert: 행동필요형 중 하나라도 있으면 true (헤더 통합 점)
 *  - items: { key: count } 항목별 건수 (메뉴 점 판단용)
 *  - refresh: 수동 재조회
 */
export default function useNotificationSummary() {
  const loginState = useSelector((state) => state?.login);
  const isLogin = Boolean(
    loginState?.email || loginState?.memberId ||
    (typeof window !== 'undefined' && sessionStorage.getItem('accessToken'))
  );

  const [data, setData] = useState({ hasAlert: false, items: {} });

  const refresh = useCallback(async () => {
    if (!isLogin) { setData({ hasAlert: false, items: {} }); return; }
    try {
      const res = await getNotificationSummary();
      setData({ hasAlert: Boolean(res?.hasAlert), items: res?.items || {} });
    } catch {
      setData({ hasAlert: false, items: {} }); // 알림은 부가 기능 — 실패해도 무시
    }
  }, [isLogin]);

  // 로그인/계정 전환 시 재조회
  useEffect(() => {
    refresh();
  }, [refresh, loginState?.memberId]);

  return { hasAlert: data.hasAlert, items: data.items, refresh };
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
