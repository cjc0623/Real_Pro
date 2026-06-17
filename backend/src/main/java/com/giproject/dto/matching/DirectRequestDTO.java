package com.giproject.dto.matching;

import java.time.LocalDateTime;

import com.giproject.entity.matching.RequestStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 직접요청(Direct Request) 한 건의 표시용 DTO — 방법 B.
 * - 차주 수신함: 누가(memId/화주) 어떤 운송을 요청했는지
 * - 화주 보낸함: 어떤 차주(driverId/driverName)에게 보냈고 상태가 어떤지
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DirectRequestDTO {

	private Long requestId;     // DirectRequest.id
	private Long eno;           // 견적 번호
	private Long matchingNo;    // 수락 시 승격된 Matching 번호 (그 외 null)

	private RequestStatus status;
	private LocalDateTime requestedAt;
	private LocalDateTime respondedAt;

	// 양측 식별 정보
	private String memId;       // 화주 아이디
	private String driverId;    // 차주(cargoOwner) 아이디
	private String driverName;  // 차주 이름

	// 견적 요약
	private String route;       // 출발 - 도착
	private String distanceKm;
	private String cargoWeight;
	private String cargoType;
	private String startTime;
	private String totalCost;
}
