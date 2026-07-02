package com.giproject.repository.cargo;

import com.giproject.entity.cargo.Cargo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CargoRepository extends JpaRepository<Cargo, Integer> {

    // 특정 소유자의 차량 리스트 가져오기
    List<Cargo> findByCargoOwner_CargoId(String cargoId);

	List<Cargo> findByStatus(String string);
	
	boolean existsByCargoOwner_CargoIdAndStatus(String cargoId, String status);
	
	List<Cargo> findByCargoOwner_CargoIdAndStatus(String cargoId, String status);

	/** 알림(차주 정보형): 내 차량 중 특정 상태(예: APPROVED) 개수 */
	long countByCargoOwner_CargoIdAndStatus(String cargoId, String status);

	/** 알림(관리자 행동필요): 특정 상태(예: PENDING 승인 대기) 차량 개수 */
	long countByStatus(String status);
}