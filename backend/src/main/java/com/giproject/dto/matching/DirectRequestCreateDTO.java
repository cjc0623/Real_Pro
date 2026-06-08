package com.giproject.dto.matching;

import java.util.List;

import com.giproject.dto.estimate.EstimateDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 직접요청 생성 요청 본문 — 방법 B.
 * 견적 1개(estimate)를 차주 N명(cargoIds)에게 동시 요청(팬아웃)한다.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DirectRequestCreateDTO {

	private EstimateDTO estimate;
	private List<String> cargoIds;
}
