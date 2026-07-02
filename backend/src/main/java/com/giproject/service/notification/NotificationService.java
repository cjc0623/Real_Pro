package com.giproject.service.notification;

import org.springframework.security.core.Authentication;

import com.giproject.dto.notification.NotificationSummaryDTO;

/**
 * 로그인 사용자의 "확인 필요" 알림 요약 제공.
 * 역할(SHIPPER/DRIVER/ADMIN)에 따라 서로 다른 신호를 집계한다.
 */
public interface NotificationService {

    NotificationSummaryDTO getSummary(Authentication authentication);
}
