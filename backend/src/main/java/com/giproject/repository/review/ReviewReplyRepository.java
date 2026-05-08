package com.giproject.repository.review;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.giproject.entity.review.ReviewReply;

public interface ReviewReplyRepository extends JpaRepository<ReviewReply, Long> {

    Optional<ReviewReply> findByReview_ReviewNo(Long reviewNo);

    boolean existsByReview_ReviewNo(Long reviewNo);
    
    void deleteByReview_ReviewNo(Long reviewNo);
    
    @Query("""
    	    SELECT rr
    	    FROM ReviewReply rr
    	    WHERE rr.review.reviewNo IN :reviewNos
    	""")
    	List<ReviewReply> findByReviewNos(@Param("reviewNos") List<Long> reviewNos);
}