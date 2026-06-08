package com.giproject.entity.matching;

public enum RequestStatus {
	REQUESTED, // 요청중 (차주 응답 대기)
	ACCEPTED,  // 차주 수락됨
	REJECTED,  // 차주 거절됨
	CANCELED;  // 화주 취소됨
}
