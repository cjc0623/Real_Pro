package com.giproject.entity.auth;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 폐기(revoke)된 refresh 토큰 식별자(jti) 저장소.
 * - 로그아웃 시, 그리고 회전(rotation) 시 기존 refresh 토큰을 여기에 등록해
 *   재사용을 서버측에서 차단한다.
 * - expiresAt 은 원 토큰 만료 시각으로, 이후 정리(cleanup)에 사용한다.
 */
@Entity
@Table(name = "revoked_token")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevokedToken {

    @Id
    @Column(length = 64)
    private String jti;

    @Column(nullable = false)
    private LocalDateTime expiresAt;
}
