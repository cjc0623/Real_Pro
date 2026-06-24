package com.giproject.service.auth;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giproject.entity.auth.RevokedToken;
import com.giproject.repository.auth.RevokedTokenRepository;

import lombok.RequiredArgsConstructor;

/**
 * refresh 토큰 서버측 폐기(blacklist) 서비스.
 * 토큰의 jti 를 기준으로 폐기 여부를 관리한다.
 */
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final RevokedTokenRepository repo;

    @Transactional(readOnly = true)
    public boolean isRevoked(String jti) {
        return jti != null && !jti.isBlank() && repo.existsById(jti);
    }

    @Transactional
    public void revoke(String jti, LocalDateTime expiresAt) {
        if (jti == null || jti.isBlank()) return;          // jti 없는 구버전 토큰은 폐기 대상 아님
        if (repo.existsById(jti)) return;                  // 이미 폐기됨
        repo.save(RevokedToken.builder()
                .jti(jti)
                .expiresAt(expiresAt != null ? expiresAt : LocalDateTime.now().plusDays(7))
                .build());
    }
}
