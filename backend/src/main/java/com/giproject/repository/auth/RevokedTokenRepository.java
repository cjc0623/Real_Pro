package com.giproject.repository.auth;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.giproject.entity.auth.RevokedToken;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, String> {

    /** 만료된 폐기기록 정리(선택적 배치용) */
    @Modifying
    @Query("DELETE FROM RevokedToken r WHERE r.expiresAt < :now")
    int deleteExpired(@Param("now") LocalDateTime now);
}
