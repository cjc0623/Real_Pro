package com.giproject.dto.review;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.giproject.entity.delivery.DeliveryStatus;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MyReviewListDTO {

    private Long reviewNo;
    private Long deliveryNo;
    private BigDecimal rating;
    private String comment;
    private LocalDateTime createdAt;

    private String cargoType;
    private String cargoWeight;
    private String startAddress;
    private String endAddress;
    private LocalDateTime deliveryCompletedAt;
    private String driverName;
    private DeliveryStatus deliveryStatus;

    private String writerId;
    private String writerName;
    private String writerProfileImage;

    private String driverId;
    private String driverProfileImage;

    private List<ReviewImageDTO> images;

    public MyReviewListDTO(
            Long reviewNo,
            Long deliveryNo,
            BigDecimal rating,
            String comment,
            LocalDateTime createdAt,
            String cargoType,
            String cargoWeight,
            String startAddress,
            String endAddress,
            LocalDateTime deliveryCompletedAt,
            String driverName,
            DeliveryStatus deliveryStatus,
            String writerId,
            String writerName,
            String writerProfileImage,
            String driverId,
            String driverProfileImage) {
        this.reviewNo = reviewNo;
        this.deliveryNo = deliveryNo;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
        this.cargoType = cargoType;
        this.cargoWeight = cargoWeight;
        this.startAddress = startAddress;
        this.endAddress = endAddress;
        this.deliveryCompletedAt = deliveryCompletedAt;
        this.driverName = driverName;
        this.deliveryStatus = deliveryStatus;
        this.writerId = writerId;
        this.writerName = writerName;
        this.writerProfileImage = writerProfileImage;
        this.driverId = driverId;
        this.driverProfileImage = driverProfileImage;
    }
    private ReviewReplyDTO reply;
}