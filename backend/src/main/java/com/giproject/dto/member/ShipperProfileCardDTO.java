package com.giproject.dto.member;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 화주(Member) 공개 프로필 카드.
 * - 차주가 운송접수목록에서 화주 아이디 클릭 시 표시.
 * - 민감정보(전화번호/주소/이메일)는 포함하지 않는다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipperProfileCardDTO {

    private String memberId;
    private String memberName;
    private String memberProfileImage; // 웹 경로(webPath) 또는 null
    private LocalDateTime createdAt;    // 가입일
}
