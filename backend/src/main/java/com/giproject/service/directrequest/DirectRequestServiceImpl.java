package com.giproject.service.directrequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giproject.dto.matching.DirectRequestDTO;
import com.giproject.entity.estimate.Estimate;
import com.giproject.entity.matching.DirectRequest;
import com.giproject.entity.matching.Matching;
import com.giproject.entity.matching.RequestStatus;
import com.giproject.repository.matching.DirectRequestRepository;
import com.giproject.repository.matching.MatchingRepository;
import com.giproject.service.estimate.matching.MatchingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Log4j2
public class DirectRequestServiceImpl implements DirectRequestService {

	private final DirectRequestRepository directRequestRepository;
	private final MatchingRepository matchingRepository;
	private final MatchingService matchingService; // validateOwnerCanAccept / makeShortRoute 재사용

	@Override
	public List<DirectRequestDTO> getReceived(String cargoId) {
		return directRequestRepository.findReceived(cargoId).stream()
				.map(this::toDTO)
				.collect(Collectors.toList());
	}

	@Override
	public List<DirectRequestDTO> getSent(String memId) {
		return directRequestRepository.findSent(memId).stream()
				.map(this::toDTO)
				.collect(Collectors.toList());
	}

	@Override
	@Transactional
	public Long accept(Long requestId, String cargoId) {
		DirectRequest request = directRequestRepository.findById(requestId)
				.orElseThrow(() -> new RuntimeException("해당 직접요청이 존재하지 않습니다"));

		// 소유권 검증
		if (request.getCargoOwner() == null || !request.getCargoOwner().getCargoId().equals(cargoId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "본인에게 온 직접요청만 수락할 수 있습니다");
		}
		// 상태 검증
		if (request.getStatus() != RequestStatus.REQUESTED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 처리된 직접요청입니다");
		}

		Estimate estimate = request.getEstimate();

		// 상호배제: 이미 매칭 완료(공개/직접 어느 경로든)된 견적이면 차단
		if (estimate.isMatched()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 매칭이 완료된 건입니다");
		}

		// 승인 차량/톤수 검증 (공개모집 수락과 동일 로직 공유)
		matchingService.validateOwnerCanAccept(estimate, request.getCargoOwner());

		LocalDateTime now = LocalDateTime.now();

		// Matching 승격 생성 (수락된 거래의 단일 앵커 → 결제/배송/리뷰 파이프라인 진입)
		Matching matching = Matching.builder()
				.estimate(estimate)
				.cargoOwner(request.getCargoOwner())
				.isAccepted(true)
				.acceptedTime(now)
				.build();
		matchingRepository.save(matching);

		// 견적 락
		estimate.changeMatched(true);

		// 요청 확정
		request.changeStatus(RequestStatus.ACCEPTED);
		request.changeRespondedAt(now);
		request.changeMatching(matching);

		// 형제 요청(같은 견적, 아직 REQUESTED) 일괄 CANCELED
		List<DirectRequest> siblings =
				directRequestRepository.findByEstimateAndStatus(estimate.getEno(), RequestStatus.REQUESTED);
		for (DirectRequest sib : siblings) {
			if (!sib.getId().equals(request.getId())) {
				sib.changeStatus(RequestStatus.CANCELED);
				sib.changeRespondedAt(now);
			}
		}

		log.info("직접요청 수락 - requestId: {}, 승격 matchingNo: {}, 취소된 형제: {}건",
				requestId, matching.getMatchingNo(), siblings.size());

		return matching.getMatchingNo();
	}

	@Override
	@Transactional
	public void reject(Long requestId, String cargoId) {
		DirectRequest request = directRequestRepository.findById(requestId)
				.orElseThrow(() -> new RuntimeException("해당 직접요청이 존재하지 않습니다"));

		if (request.getCargoOwner() == null || !request.getCargoOwner().getCargoId().equals(cargoId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "본인에게 온 직접요청만 거절할 수 있습니다");
		}
		if (request.getStatus() != RequestStatus.REQUESTED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 처리된 직접요청입니다");
		}

		request.changeStatus(RequestStatus.REJECTED);
		request.changeRespondedAt(LocalDateTime.now());
	}

	@Override
	@Transactional
	public void cancel(Long requestId, String memId) {
		DirectRequest request = directRequestRepository.findById(requestId)
				.orElseThrow(() -> new RuntimeException("해당 직접요청이 존재하지 않습니다"));

		Estimate e = request.getEstimate();
		// 소유권: 견적의 화주만 취소 가능
		if (e.getMember() == null || !e.getMember().getMemId().equals(memId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "본인이 보낸 직접요청만 취소할 수 있습니다");
		}
		// 수락/거절/취소된 건은 취소 불가
		if (request.getStatus() != RequestStatus.REQUESTED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "응답 대기 중인 요청만 취소할 수 있습니다");
		}

		request.changeStatus(RequestStatus.CANCELED);
		request.changeRespondedAt(LocalDateTime.now());
	}

	@Override
	@Transactional
	public int cancelGroup(Long eno, String memId) {
		List<DirectRequest> pendings =
				directRequestRepository.findByEstimateAndStatus(eno, RequestStatus.REQUESTED);

		LocalDateTime now = LocalDateTime.now();
		int count = 0;
		for (DirectRequest r : pendings) {
			Estimate e = r.getEstimate();
			// 소유권 없는 건은 건너뜀(방어)
			if (e.getMember() == null || !e.getMember().getMemId().equals(memId)) {
				continue;
			}
			r.changeStatus(RequestStatus.CANCELED);
			r.changeRespondedAt(now);
			count++;
		}
		if (count == 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "취소할 대기 중인 요청이 없습니다");
		}
		return count;
	}

	// ===== 매퍼 =====

	private DirectRequestDTO toDTO(DirectRequest r) {
		Estimate e = r.getEstimate();
		String startDateStr = (e.getStartTime() != null)
				? e.getStartTime().toLocalDate().toString()
				: "날짜 미지정";

		return DirectRequestDTO.builder()
				.requestId(r.getId())
				.eno(e.getEno())
				.matchingNo(r.getMatching() != null ? r.getMatching().getMatchingNo() : null)
				.status(r.getStatus())
				.requestedAt(r.getRequestedAt())
				.respondedAt(r.getRespondedAt())
				.memId(e.getMember() != null ? e.getMember().getMemId() : null)
				.driverId(r.getCargoOwner() != null ? r.getCargoOwner().getCargoId() : null)
				.driverName(r.getCargoOwner() != null ? r.getCargoOwner().getCargoName() : null)
				.route(matchingService.makeShortRoute(e.getStartAddress(), e.getEndAddress()))
				.distanceKm(e.getDistanceKm() + "KM")
				.cargoWeight(e.getCargoWeight())
				.cargoType(e.getCargoType())
				.startTime(startDateStr)
				.totalCost(String.format("%,d원", e.getTotalCost()))
				.build();
	}
}
