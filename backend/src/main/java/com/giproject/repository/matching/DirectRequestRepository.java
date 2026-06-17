package com.giproject.repository.matching;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.giproject.entity.matching.DirectRequest;
import com.giproject.entity.matching.RequestStatus;

public interface DirectRequestRepository extends JpaRepository<DirectRequest, Long> {

    /** 차주 수신함: 나에게 온 직접요청 (상태 무관, 최신순) */
    @Query("SELECT r FROM DirectRequest r WHERE r.cargoOwner.cargoId = :cargoId ORDER BY r.id DESC")
    List<DirectRequest> findReceived(@Param("cargoId") String cargoId);

    /** 화주 보낸함: 내가 보낸 직접요청 (견적의 화주 기준, 최신순) */
    @Query("SELECT r FROM DirectRequest r WHERE r.estimate.member.memId = :memId ORDER BY r.id DESC")
    List<DirectRequest> findSent(@Param("memId") String memId);

    /** 형제 요청: 같은 견적에서 특정 상태인 행 (수락 시 REQUESTED → CANCELED 일괄 처리용) */
    @Query("SELECT r FROM DirectRequest r WHERE r.estimate.eno = :eno AND r.status = :status")
    List<DirectRequest> findByEstimateAndStatus(@Param("eno") Long eno, @Param("status") RequestStatus status);

    /** 같은 견적을 같은 차주에게 중복 요청했는지 확인 */
    boolean existsByEstimate_EnoAndCargoOwner_CargoId(Long eno, String cargoId);
}
