package com.giproject.dto.review;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverTrustScoreDTO {

    private String cargoId;

    private int trustScore;
    private String trustGrade;

    private BigDecimal averageRating;
    private long reviewCount;

    private long positiveReviewCount;
    private long neutralReviewCount;
    private long negativeReviewCount;

    private long completedDeliveryCount;

    private boolean verified;
    
    private int ratingScore;
    private int reviewScore;
    private int deliveryScore;
    private int sentimentScore;
    private int verifiedScore;
}