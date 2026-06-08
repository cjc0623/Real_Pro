package com.giproject.controller.estimate;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giproject.dto.estimate.EstimateDTO;
import com.giproject.dto.matching.DirectRequestCreateDTO;
import com.giproject.dto.matching.DirectRequestDTO;
import com.giproject.dto.review.DriverProfileCardDTO;
import com.giproject.service.directrequest.DirectRequestService;
import com.giproject.service.estimate.EstimateService;
import com.giproject.service.review.ReviewService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 직접요청(Direct Request) 전용 컨트롤러 — 방법 B.
 * - 화주: 차주 탐색 / 직접요청 생성(다중 차주 팬아웃) / 보낸 요청 조회
 * - 차주: 받은 요청 조회 / 수락(Matching 승격) / 거절
 *
 * 보안: /g2i4/estimate/** 중 subpath 외 경로라 SecurityConfig의 anyRequest().authenticated() 적용.
 *       권한/소유권 세부 검증은 서비스 계층에서 수행.
 */
@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/g2i4/estimate")
public class DirectRequestController {

	private final ReviewService reviewService;
	private final EstimateService estimateService;
	private final DirectRequestService directRequestService;

	/** 화주: 차주 탐색 목록 (평점/리뷰수 요약 포함) */
	@GetMapping("/drivers")
	public ResponseEntity<List<DriverProfileCardDTO>> getDrivers(
			@RequestParam(name = "keyword", required = false) String keyword,
			@RequestParam(name = "requireVehicle", defaultValue = "true") boolean requireVehicle) {
		return ResponseEntity.ok(reviewService.getDriverCards(keyword, requireVehicle));
	}

	/** 화주: 직접요청 생성 (견적 1개 신규작성 + 차주 N명에게 팬아웃) */
	@PostMapping("/direct-request")
	public ResponseEntity<?> createDirectRequest(
			@RequestBody DirectRequestCreateDTO body,
			Authentication authentication) {
		try {
			EstimateDTO dto = body.getEstimate();
			dto.setMemberId(authentication.getName()); // 로그인 화주
			List<Long> requestIds = estimateService.createDirectRequests(dto, body.getCargoIds());
			return ResponseEntity.ok(Map.of("requestIds", requestIds));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
		}
	}

	/** 화주: 내가 보낸 직접요청 목록 */
	@GetMapping("/direct-requests/sent")
	public ResponseEntity<List<DirectRequestDTO>> getSentDirectRequests(Authentication authentication) {
		return ResponseEntity.ok(directRequestService.getSent(authentication.getName()));
	}

	/** 차주: 나에게 온 직접요청 목록 */
	@GetMapping("/direct-requests/received")
	public ResponseEntity<List<DirectRequestDTO>> getReceivedDirectRequests(Authentication authentication) {
		return ResponseEntity.ok(directRequestService.getReceived(authentication.getName()));
	}

	/** 차주: 직접요청 수락 (Matching 승격 → 결제 단계 진입) */
	@PostMapping("/direct-request/{requestId}/accept")
	public ResponseEntity<?> acceptDirectRequest(
			@PathVariable("requestId") Long requestId,
			Authentication authentication) {
		try {
			Long matchingNo = directRequestService.accept(requestId, authentication.getName());
			return ResponseEntity.ok(Map.of("result", "accepted", "matchingNo", matchingNo));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
		}
	}

	/** 차주: 직접요청 거절 */
	@PostMapping("/direct-request/{requestId}/reject")
	public ResponseEntity<?> rejectDirectRequest(
			@PathVariable("requestId") Long requestId,
			Authentication authentication) {
		try {
			directRequestService.reject(requestId, authentication.getName());
			return ResponseEntity.ok(Map.of("result", "rejected"));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
		}
	}

	/** 화주: 직접요청 1건 취소 (응답 대기 상태만) */
	@PostMapping("/direct-request/{requestId}/cancel")
	public ResponseEntity<?> cancelDirectRequest(
			@PathVariable("requestId") Long requestId,
			Authentication authentication) {
		try {
			directRequestService.cancel(requestId, authentication.getName());
			return ResponseEntity.ok(Map.of("result", "canceled"));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
		}
	}

	/** 화주: 한 견적(배송)의 대기 중 직접요청 전체 취소 */
	@PostMapping("/direct-requests/group/{eno}/cancel")
	public ResponseEntity<?> cancelDirectRequestGroup(
			@PathVariable("eno") Long eno,
			Authentication authentication) {
		try {
			int canceled = directRequestService.cancelGroup(eno, authentication.getName());
			return ResponseEntity.ok(Map.of("result", "canceled", "count", canceled));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
		}
	}
}
