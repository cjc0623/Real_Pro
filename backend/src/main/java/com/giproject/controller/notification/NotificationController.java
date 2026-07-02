package com.giproject.controller.notification;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.giproject.dto.notification.NotificationSummaryDTO;
import com.giproject.service.notification.NotificationService;

import lombok.RequiredArgsConstructor;

/**
 * 헤더 프로필 아바타 알림 뱃지용 컨트롤러.
 * 보안: SecurityConfig의 anyRequest().authenticated() 적용(별도 permitAll 없음).
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/fr/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    /** 로그인 사용자의 "확인 필요" 요약 (역할별 집계) */
    @GetMapping("/summary")
    public ResponseEntity<NotificationSummaryDTO> summary(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getSummary(authentication));
    }
}
