package com.giproject.repository.review;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.giproject.dto.review.DriverProfileCardDTO;
import com.giproject.dto.review.MyReviewListDTO;
import com.giproject.dto.review.MyReviewWithDriverIdDTO;
import com.giproject.dto.review.ReviewSummaryDTO;
import com.giproject.entity.review.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
	boolean existsByDeliveryNo(Long deliveryNo);// 중복확인용

	Optional<Review> findByDeliveryNo(Long deliveryNo);

	List<Review> findAllByOrderByCreatedAtDesc();
	

	//신뢰도 전용 
	List<Review> findByTargetCargoId(String targetCargoId);
	
	// 리뷰 작성자 memId 찾기
	@Query("""
	        SELECT r.writerMemberId
	        FROM Review r
	        WHERE r.reviewNo = :reviewNo
	        """)
	Optional<String> findWriterMemIdByReviewNo(@Param("reviewNo") Long reviewNo);

	// 리뷰의 cargoId 찾기
	@Query("""
	        SELECT r.targetCargoId
	        FROM Review r
	        WHERE r.reviewNo = :reviewNo
	        """)
	Optional<String> findTargetCargoIdByReviewNo(@Param("reviewNo") Long reviewNo);

	@Query("""
			    select new com.giproject.dto.review.ReviewSummaryDTO(
			        m.cargoOwner.cargoId,
			        avg(r.rating),
			        count(r)
			    )
			    from Review r
			    join Delivery d on r.deliveryNo = d.deliveryNo
			    join d.payment p
			    join p.orderSheet os
			    join os.matching m
			    where m.cargoOwner.cargoId = :cargoId
			    group by m.cargoOwner.cargoId
			""")
	Optional<ReviewSummaryDTO> findReviewSummaryByCargoId(@Param("cargoId") String cargoId);

	@Query("""
			    select r
			    from Review r
			    join Delivery d on r.deliveryNo = d.deliveryNo
			    join d.payment p
			    join p.orderSheet os
			    join os.matching m
			    where m.cargoOwner.cargoId = :cargoId
			    order by r.createdAt desc
			""")
	List<Review> findReviewsByCargoId(@Param("cargoId") String cargoId);

	@Query(value = """
			    select r
			    from Review r
			    join Delivery d on r.deliveryNo = d.deliveryNo
			    join d.payment p
			    join p.orderSheet os
			    join os.matching m
			    where m.cargoOwner.cargoId = :cargoId
			    order by r.createdAt desc
			""", countQuery = """
			    select count(r)
			    from Review r
			    join Delivery d on r.deliveryNo = d.deliveryNo
			    join d.payment p
			    join p.orderSheet os
			    join os.matching m
			    where m.cargoOwner.cargoId = :cargoId
			""")
	Page<Review> findReviewsByCargoId(@Param("cargoId") String cargoId, Pageable pageable);

	@Query("""
			SELECT new com.giproject.dto.review.MyReviewListDTO(
			    r.reviewNo,
			    r.deliveryNo,
			    r.rating,
			    r.comment,
			    r.createdAt,
			    e.cargoType,
			    e.cargoWeight,
			    e.startAddress,
			    e.endAddress,
			    d.completTime,
			    m.cargoOwner.cargoName,
			    d.status,
			    e.member.memId,
			    e.member.memName,
			    e.member.profileImage,
				m.cargoOwner.cargoId,
				m.cargoOwner.profileImage
			    
			)
			FROM Review r
			JOIN Delivery d ON r.deliveryNo = d.deliveryNo
			JOIN d.payment p
			JOIN p.orderSheet os
			JOIN os.matching m
			JOIN m.estimate e
			WHERE r.writerMemberId = :memId
			ORDER BY r.createdAt DESC
			""")
	List<MyReviewListDTO> findMyReviewsByWriterMemId(@Param("memId") String memId);

	@Query("""
			SELECT new com.giproject.dto.review.MyReviewListDTO(
			    r.reviewNo,
			    r.deliveryNo,
			    r.rating,
			    r.comment,
			    r.createdAt,
			    e.cargoType,
			    e.cargoWeight,
			    e.startAddress,
			    e.endAddress,
			    d.completTime,
			    m.cargoOwner.cargoName,
			    d.status,
			    e.member.memId,
			    e.member.memName,
				e.member.profileImage,
				m.cargoOwner.cargoId,
				m.cargoOwner.profileImage
			)
			FROM Review r
			JOIN Delivery d ON r.deliveryNo = d.deliveryNo
			JOIN d.payment p
			JOIN p.orderSheet os
			JOIN os.matching m
			JOIN m.estimate e
			WHERE r.targetCargoId = :cargoId
			ORDER BY r.createdAt DESC
			""")
	List<MyReviewListDTO> findReceivedReviewsByCargoId(@Param("cargoId") String cargoId);
	
	@Query("""
			SELECT new com.giproject.dto.review.MyReviewWithDriverIdDTO(
			    r.reviewNo,
			    r.deliveryNo,
			    r.rating,
			    r.comment,
			    r.createdAt,
			    e.cargoType,
			    e.cargoWeight,
			    e.startAddress,
			    e.endAddress,
			    d.completTime,
			    m.cargoOwner.cargoId,
				m.cargoOwner.cargoName,
				m.cargoOwner.profileImage,
				d.status,
				e.member.memId      
			)
			FROM Review r
			JOIN Delivery d ON r.deliveryNo = d.deliveryNo
			JOIN d.payment p
			JOIN p.orderSheet os
			JOIN os.matching m
			JOIN m.estimate e
			WHERE r.writerMemberId = :memId
			ORDER BY r.createdAt DESC
			""")
		List<MyReviewWithDriverIdDTO> findMyReviewsWithDriverIdByWriterMemId(@Param("memId") String memId);

	
	@Query("""
		    SELECT new com.giproject.dto.review.DriverProfileCardDTO(
		        c.cargoId,
		        c.cargoName,
		        c.profileImage,
		        (
		            SELECT avg(r.rating)
		            FROM Review r
		            JOIN Delivery d ON r.deliveryNo = d.deliveryNo
		            JOIN d.payment p
		            JOIN p.orderSheet os
		            JOIN os.matching m
		            WHERE m.cargoOwner.cargoId = c.cargoId
		        ),
		        (
		            SELECT count(r2)
		            FROM Review r2
		            JOIN Delivery d2 ON r2.deliveryNo = d2.deliveryNo
		            JOIN d2.payment p2
		            JOIN p2.orderSheet os2
		            JOIN os2.matching m2
		            WHERE m2.cargoOwner.cargoId = c.cargoId
		        ),
		        c.isVerified
		    )
		    FROM CargoOwner c
		    WHERE c.cargoId = :cargoId
		    """)
		Optional<DriverProfileCardDTO> findDriverProfileCardByCargoId(@Param("cargoId") String cargoId);

		// 화주 직접요청용: 차주 탐색 목록 (평점/리뷰수 요약 포함)
		// keyword(이름) 부분검색, requireVehicle=true 면 승인된 차량 보유 차주만
		@Query("""
			    SELECT new com.giproject.dto.review.DriverProfileCardDTO(
			        c.cargoId,
			        c.cargoName,
			        c.profileImage,
			        (
			            SELECT avg(r.rating)
			            FROM Review r
			            JOIN Delivery d ON r.deliveryNo = d.deliveryNo
			            JOIN d.payment p
			            JOIN p.orderSheet os
			            JOIN os.matching m
			            WHERE m.cargoOwner.cargoId = c.cargoId
			        ),
			        (
			            SELECT count(r2)
			            FROM Review r2
			            JOIN Delivery d2 ON r2.deliveryNo = d2.deliveryNo
			            JOIN d2.payment p2
			            JOIN p2.orderSheet os2
			            JOIN os2.matching m2
			            WHERE m2.cargoOwner.cargoId = c.cargoId
			        ),
			        c.isVerified
			    )
			    FROM CargoOwner c
			    WHERE (:keyword IS NULL OR LOWER(c.cargoName) LIKE LOWER(CONCAT('%', :keyword, '%')))
			      AND (:requireVehicle = false OR EXISTS (
			            SELECT 1 FROM Cargo cg
			            WHERE cg.cargoOwner = c AND cg.status = 'APPROVED'
			      ))
			    """)
		List<DriverProfileCardDTO> findDriverProfileCards(
			@Param("keyword") String keyword,
			@Param("requireVehicle") boolean requireVehicle);

		/** 알림(차주 정보형): 나에게 작성된 리뷰 총 개수 */
		long countByTargetCargoId(String targetCargoId);
}
