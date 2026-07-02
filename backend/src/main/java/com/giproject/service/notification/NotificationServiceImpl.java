package com.giproject.service.notification;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import com.giproject.dto.notification.NotificationSummaryDTO;
import com.giproject.entity.delivery.DeliveryStatus;
import com.giproject.entity.matching.RequestStatus;
import com.giproject.repository.cargo.CargoRepository;
import com.giproject.repository.delivery.DeliveryRepository;
import com.giproject.repository.matching.DirectRequestRepository;
import com.giproject.repository.matching.MatchingRepository;
import com.giproject.repository.qaboard.QAPostRepository;
import com.giproject.repository.review.ReviewRepository;
import com.giproject.service.report.UserReportService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 역할별 "확인 필요" 신호 집계.
 *
 * 🔴 행동필요형(처리하면 자동으로 0이 됨) → hasAlert(빨간점)에 반영:
 *   - ADMIN  : 미확인 신고, 미답변 문의, 차량 승인 대기
 *   - DRIVER : 배송 시작 대기(결제 후 시작 전), 받은 직접요청(응답 대기)
 *   - SHIPPER: 견적 수락·결제 전
 * ℹ️ 정보형(누적, 줄지 않음) → items엔 넣되 hasAlert엔 미반영:
 *   - DRIVER : 받은 리뷰, 승인된 내 차량
 *   - SHIPPER: 배송완료 화물
 *
 * loginId(auth.getName())는 화주=memId, 차주=cargoId 로 사용된다.
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class NotificationServiceImpl implements NotificationService {

    private final DeliveryRepository deliveryRepository;
    private final DirectRequestRepository directRequestRepository;
    private final MatchingRepository matchingRepository;
    private final QAPostRepository qaPostRepository;
    private final CargoRepository cargoRepository;
    private final ReviewRepository reviewRepository;
    private final UserReportService userReportService;

    @Override
    public NotificationSummaryDTO getSummary(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return NotificationSummaryDTO.builder().hasAlert(false).total(0).role("GUEST").items(Map.of()).build();
        }

        String loginId = authentication.getName();
        Set<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        Map<String, Long> items = new LinkedHashMap<>();
        long actionable = 0; // 🔴 행동필요형 합계 → hasAlert 판단
        String role;

        try {
            if (roles.contains("ROLE_ADMIN")) {
                role = "ADMIN";
                long unreadReports = safe(userReportService.countUnread());
                long unansweredInquiries = safe(qaPostRepository.countUnansweredInquiries());
                long pendingVehicleApprovals = safe(cargoRepository.countByStatus("PENDING"));
                items.put("unreadReports", unreadReports);
                items.put("unansweredInquiries", unansweredInquiries);
                items.put("pendingVehicleApprovals", pendingVehicleApprovals);
                actionable = unreadReports + unansweredInquiries + pendingVehicleApprovals; // 모두 🔴
            } else if (roles.contains("ROLE_DRIVER")) {
                role = "DRIVER";
                long deliveryToStart = safe(deliveryRepository.countByCargoOwner_CargoIdAndStatus(loginId, DeliveryStatus.PENDING));
                long pendingDirectRequests = safe(directRequestRepository.countByCargoOwner_CargoIdAndStatus(loginId, RequestStatus.REQUESTED));
                long receivedReviews = safe(reviewRepository.countByTargetCargoId(loginId));
                long approvedVehicles = safe(cargoRepository.countByCargoOwner_CargoIdAndStatus(loginId, "APPROVED"));
                items.put("deliveryToStart", deliveryToStart);             // 🔴
                items.put("pendingDirectRequests", pendingDirectRequests); // 🔴
                items.put("receivedReviews", receivedReviews);             // ℹ️
                items.put("approvedVehicles", approvedVehicles);           // ℹ️
                actionable = deliveryToStart + pendingDirectRequests;
            } else if (roles.contains("ROLE_SHIPPER")) {
                role = "SHIPPER";
                long acceptedAwaitingPayment = safe(matchingRepository.countAcceptedAwaitingPaymentByMember(loginId));
                long deliveryCompleted = safe(deliveryRepository.countByMemberAndStatus(loginId, DeliveryStatus.COMPLETED));
                items.put("acceptedAwaitingPayment", acceptedAwaitingPayment); // 🔴
                items.put("deliveryCompleted", deliveryCompleted);             // ℹ️
                actionable = acceptedAwaitingPayment;
            } else {
                role = "USER";
            }
        } catch (Exception e) {
            // 알림은 부가 기능이므로 실패해도 화면을 막지 않는다.
            log.warn("알림 요약 집계 실패 loginId={}, err={}", loginId, e.getMessage());
            return NotificationSummaryDTO.builder().hasAlert(false).total(0).role("USER").items(Map.of()).build();
        }

        long total = items.values().stream().mapToLong(Long::longValue).sum();
        return NotificationSummaryDTO.builder()
                .hasAlert(actionable > 0)
                .total(total)
                .role(role)
                .items(items)
                .build();
    }

    private long safe(Long v) {
        return v == null ? 0L : v;
    }
}
