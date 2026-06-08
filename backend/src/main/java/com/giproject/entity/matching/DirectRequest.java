package com.giproject.entity.matching;

import java.time.LocalDateTime;

import com.giproject.entity.cargo.CargoOwner;
import com.giproject.entity.estimate.Estimate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * 직접요청(Direct Request) — 방법 B.
 * 화주가 특정 차주에게 보낸 운송 요청 1건. 하나의 견적(estimate)을 여러 차주에게
 * 팬아웃하면 견적은 공유되고 DirectRequest 행만 차주 수만큼 생성된다.
 * 차주가 수락하면 이 시점에 Matching 1건이 새로 생성(승격)되어 matching에 연결되고,
 * 같은 견적의 형제 요청(REQUESTED)은 CANCELED 처리된다.
 */
@Entity
@Table(
        name = "direct_request",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_direct_request_estimate_cargo",
                columnNames = {"eno", "cargo_id"}
        )
)
@Getter
@ToString(exclude = {"estimate", "cargoOwner", "matching"}) // 순환/지연로딩 방지
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DirectRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 요청 대상 견적 (차주들이 공유) */
    @ManyToOne
    @JoinColumn(name = "eno")
    private Estimate estimate;

    /** 지정 차주 */
    @ManyToOne
    @JoinColumn(name = "cargo_id", columnDefinition = "varchar(50)")
    private CargoOwner cargoOwner;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private RequestStatus status = RequestStatus.REQUESTED;

    /** 요청 생성 시각 */
    private LocalDateTime requestedAt;

    /** 수락/거절/취소 응답 시각 */
    private LocalDateTime respondedAt;

    /** 수락 시 승격된 Matching (그 외 NULL) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matching_no")
    private Matching matching;

    public void changeStatus(RequestStatus status) {
        this.status = status;
    }

    public void changeRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }

    public void changeMatching(Matching matching) {
        this.matching = matching;
    }
}
