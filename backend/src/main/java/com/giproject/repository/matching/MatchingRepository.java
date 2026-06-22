package com.giproject.repository.matching;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.giproject.entity.cargo.CargoOwner;
import com.giproject.entity.estimate.Estimate;
import com.giproject.entity.matching.Matching;

public interface MatchingRepository extends JpaRepository<Matching, Long> {

    @Query("""
            SELECT m FROM Matching m
            WHERE m.cargoOwner IS NULL
              AND m.isAccepted = false
              AND m.estimate.isTemp = false
              AND m.estimate.matched = false
              AND m.estimate.isOrdered = false
              AND m.estimate.startTime >= :now
              AND NOT EXISTS (
                SELECT 1 FROM RejectedMatching r
                WHERE r.cargoOwner = :cargoOwner
                  AND r.estimate = m.estimate
              )
            """)
    Page<Matching> findValidMatchingList(
            @Param("cargoOwner") CargoOwner cargoOwner,
            @Param("now") LocalDateTime now,
            Pageable pageable
    );

    // 수정: 화주도 차주와 같은 기준의 "미승인 견적"만 조회
    // 단, 화주는 거절 이력이 없으므로 RejectedMatching 조건은 제외
    @Query("""
            SELECT m FROM Matching m
            WHERE m.cargoOwner IS NULL
              AND m.isAccepted = false
              AND m.estimate.isTemp = false
              AND m.estimate.matched = false
              AND m.estimate.isOrdered = false
              AND m.estimate.startTime >= :now
            """)
    Page<Matching> findPendingMatchingListForShipper(
            @Param("now") LocalDateTime now,
            Pageable pageable
    );

    @Query("SELECT COUNT(m) > 0 FROM Matching m WHERE m.estimate.eno = :estimateNo AND m.estimate.matched = true")
    boolean checkMached(@Param("estimateNo") Long estimateNo);

    Optional<Matching> findByEstimate(Estimate estimate);

    @Query("SELECT m FROM Matching m WHERE m.estimate.eno = :eno AND m.isAccepted = true")
    Optional<Matching> findByEstimateEnoAndIsAcceptedTrue(@Param("eno") Long eno);

    @Query("SELECT m.isAccepted FROM Matching m WHERE m.estimate.eno = :estimateNo")
    Optional<Boolean> findIsAcceptedByEstimateNo(@Param("estimateNo") Long estimateNo);

    @Query("SELECT m.matchingNo FROM Matching m WHERE m.estimate.eno = :estimateNo")
    Optional<Long> findMatchingNoByEstimateNo(@Param("estimateNo") Long estimateNo);

    /**
     * 알림 뱃지(화주): 내 견적이 차주에게 수락(isAccepted=true)됐지만
     * 아직 결제(배송 생성) 전인 건수 = "확인/결제 필요" 신호.
     * 배송은 결제 시점에 생성되므로, 해당 매칭에 연결된 Delivery가 없으면 결제 전으로 본다.
     */
    @Query("""
            SELECT COUNT(m) FROM Matching m
            WHERE m.isAccepted = true
              AND m.estimate.member.memId = :memId
              AND NOT EXISTS (
                  SELECT 1 FROM Delivery d
                  JOIN d.payment p
                  JOIN p.orderSheet os
                  WHERE os.matching = m
              )
            """)
    long countAcceptedAwaitingPaymentByMember(@Param("memId") String memId);
}