package com.giproject.dto.notification;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 헤더 프로필 아바타 알림용 요약 DTO.
 * - hasAlert: 빨간점 ON 여부 (= 행동필요형 항목 중 하나라도 > 0)
 * - total: 전체 항목 합계 (참고용, 뱃지엔 미사용)
 * - role: 응답 대상의 역할 (SHIPPER/DRIVER/ADMIN, 프론트 분기용)
 * - items: 항목별 세부 건수 (드롭다운 표시용; 행동필요형 🔴 + 정보형 ℹ️ 모두 포함)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationSummaryDTO {

    private boolean hasAlert;
    private long total;
    private String role;
    private Map<String, Long> items;
}
