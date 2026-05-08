package com.giproject.dto.review;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewReplyDTO {
    private Long replyNo;
    private Long reviewNo;
    private String cargoOwnerId;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}