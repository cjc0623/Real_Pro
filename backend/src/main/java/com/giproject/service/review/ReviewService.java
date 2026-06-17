package com.giproject.service.review;

import com.giproject.dto.review.DriverTrustScoreDTO;
import com.giproject.dto.review.ReviewReplyDTO;
import com.giproject.dto.review.ReviewReplyRequest;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


import com.giproject.dto.review.DriverDetailDTO;
import com.giproject.dto.review.DriverProfileCardDTO;
import com.giproject.dto.review.MyReviewListDTO;
import com.giproject.dto.review.MyReviewWithDriverIdDTO;
import com.giproject.dto.review.ReviewCreateRequest;
import com.giproject.dto.review.ReviewDTO;
import com.giproject.dto.review.ReviewModifyRequest;
import com.giproject.dto.review.ReviewSummaryDTO;


public interface ReviewService {
	//신뢰도 점수
	DriverTrustScoreDTO getDriverTrustScore(String cargoId);
	
	//등록(create) + 다중 사진 첨부
	Long register(ReviewCreateRequest request, String loginId);
	
	//리뷰 상세+사진
	ReviewDTO getByReviewNo(Long reviewNo);
	
	ReviewDTO getByDeliveryNo(Long deliveryNo);
	
	//리뷰 리스트
	List<ReviewDTO> getList();

	//삭제(delete)
	void remove(Long reviewNo, String loginId, boolean isAdmin);
	
	//수정(update)
	//void modify(Long reviewNo, ReviewDTO reviewDTO, String loginId);
	//수정(update) + 이미지
	void modify(Long reviewNo, ReviewModifyRequest request, String loginId);
	//조회 api
	ReviewSummaryDTO getSummaryByCargoId(String cargoId);
	
	//페이징 처리
	 Page<ReviewDTO> getReviewsByCargoId(String cargoId, Pageable pageable);
	
	 //버튼 숨기기용
	 boolean existsByDeliveryNo(Long deliveryNo);
	 
	// 내가(화주) 작성한 리뷰
	 List<MyReviewListDTO> getMyReviews(String memId);
	 
	// 내가(차주) 받은 리뷰
	 List<MyReviewListDTO> getReceivedReviews(String cargoId);
	 
	// 내가(화주) 작성한 리뷰 + 차주 식별자 포함
	 List<MyReviewWithDriverIdDTO> getMyReviewsWithDriverId(String memId);

	// 차주 프로필 카드 조회
	DriverProfileCardDTO getDriverProfileCard(String cargoId);

	// 화주 직접요청용: 차주 탐색 목록 (평점/리뷰수 요약 포함)
	List<DriverProfileCardDTO> getDriverCards(String keyword, boolean requireVehicle);
	
	DriverDetailDTO getDriverDetail(String cargoId);
	
	// 차주 댓글 작성
	ReviewReplyDTO createReply(Long reviewNo, ReviewReplyRequest request, String cargoOwnerId);

	// 차주 댓글 수정
	ReviewReplyDTO modifyReply(Long reviewNo, ReviewReplyRequest request, String cargoOwnerId);

	// 차주 댓글 삭제
	void removeReply(Long reviewNo, String cargoOwnerId);

	// 리뷰 댓글 조회
	ReviewReplyDTO getReplyByReviewNo(Long reviewNo);
	
	
}
	 
