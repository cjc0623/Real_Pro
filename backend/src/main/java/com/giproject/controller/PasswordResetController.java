// src/main/java/com/giproject/controller/PasswordResetController.java
package com.giproject.controller;

import com.giproject.service.auth.PasswordResetService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth/password-reset")
public class PasswordResetController {

    private final PasswordResetService passwordResetService; // ✅ 인스턴스 주입

    /**
     * (STEP 1) 아이디 + 이메일 확인 → 챌린지 발급 + 메일 전송
     * body: { "loginId": "...", "email": "..." }
     * res:  { "challengeId": "...", "maskedEmail": "...", "ttlSeconds": 180 }
     */
    @PostMapping("/request")
    public ResponseEntity<?> request(@RequestBody RequestDto dto) {
        if (isBlank(dto.getLoginId()) || isBlank(dto.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "LOGIN_ID_AND_EMAIL_REQUIRED"));
        }
        try {
            // 🔒 사용자 열거 방지: 존재 여부와 무관하게 항상 동일한 200 응답(문구·시간 동일)
            var r = passwordResetService.startReset(dto.getLoginId().trim(), dto.getEmail().trim());
            return ResponseEntity.ok(Map.of(
                    "challengeId", r.getChallengeId(),
                    "maskedEmail", r.getMaskedEmail(),
                    "ttlSeconds",  r.getTtlSeconds()
            ));
        } catch (PasswordResetService.TooManyRequestsException e) {
            // 재요청 쿨다운 — 입력 아이디 기준이라 계정 존재 여부를 드러내지 않음
            return ResponseEntity.status(429).body(Map.of("message", "TOO_MANY_REQUESTS"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "INTERNAL_ERROR"));
        }
    }

    /**
     * (STEP 2) 코드 검증 → resetToken 발급
     * body: { "challengeId": "...", "code": "123456" }
     * res:  { "resetToken": "..." }
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyDto dto) {
        if (isBlank(dto.getChallengeId()) || isBlank(dto.getCode())) {
            return ResponseEntity.badRequest().body(Map.of("message", "INVALID_REQUEST"));
        }
        try {
            var r = passwordResetService.verifyCode(dto.getChallengeId().trim(), dto.getCode().trim());
            return ResponseEntity.ok(Map.of("resetToken", r.getResetToken()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "INVALID_OR_EXPIRED_CODE"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "INTERNAL_ERROR"));
        }
    }

    /**
     * (STEP 3) resetToken 검증 후 비밀번호 변경
     * body: { "resetToken": "...", "newPassword": "..." }
     * res:  { "ok": true }
     */
    @PostMapping("/complete")
    public ResponseEntity<?> complete(@RequestBody CompleteDto dto) {
        if (isBlank(dto.getResetToken()) || isBlank(dto.getNewPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "INVALID_REQUEST"));
        }
        try {
            passwordResetService.completeReset(dto.getResetToken().trim(), dto.getNewPassword());
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            // 🔒 서버측 비밀번호 정책 위반과 토큰 무효를 구분해 안내(둘 다 계정 존재 여부는 노출 안 함)
            String msg = "WEAK_PASSWORD".equals(e.getMessage()) ? "WEAK_PASSWORD" : "INVALID_RESET_TOKEN";
            return ResponseEntity.badRequest().body(Map.of("message", msg));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "INTERNAL_ERROR"));
        }
    }

    /* ---------------- DTO ---------------- */

    @Data
    public static class RequestDto {
        private String loginId;
        private String email;
    }

    @Data
    public static class VerifyDto  {
        private String challengeId;
        private String code;
    }

    @Data
    public static class CompleteDto {
        private String resetToken;
        private String newPassword;
    }

    /* ---------------- util ---------------- */

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
