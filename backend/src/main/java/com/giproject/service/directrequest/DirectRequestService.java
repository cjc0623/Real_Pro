package com.giproject.service.directrequest;

import java.util.List;

import com.giproject.dto.matching.DirectRequestDTO;

import jakarta.transaction.Transactional;

/**
 * 직접요청(Direct Request) 서비스 — 방법 B.
 * 요청 조회/수락(Matching 승격)/거절을 담당한다. 견적+요청 생성(팬아웃)은
 * EstimateService.createDirectRequests 가 담당한다.
 */
@Transactional
public interface DirectRequestService {

	/** 차주 수신함: 나에게 온 직접요청 목록 */
	List<DirectRequestDTO> getReceived(String cargoId);

	/** 화주 보낸함: 내가 보낸 직접요청 목록 */
	List<DirectRequestDTO> getSent(String memId);

	/**
	 * 차주가 직접요청을 수락한다. 소유권/상태/상호배제/차량을 검증하고,
	 * Matching 1건을 새로 생성(승격)한 뒤 같은 견적의 형제 요청을 CANCELED 처리한다.
	 * @return 승격된 matchingNo (결제 단계 진입용)
	 */
	Long accept(Long requestId, String cargoId);

	/** 차주가 직접요청을 거절한다. */
	void reject(Long requestId, String cargoId);

	/** 화주가 보낸 직접요청 1건을 취소한다. REQUESTED 상태만 가능. */
	void cancel(Long requestId, String memId);

	/**
	 * 화주가 한 견적(배송)의 대기 중(REQUESTED) 요청을 모두 취소한다.
	 * @return 실제로 취소된 건수
	 */
	int cancelGroup(Long eno, String memId);
}
