// src/main/java/com/moviebuff/model/review/Review.java
package com.moviebuff.moviebuff_backend.model.review;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "reviews")
public class Review {
    @Id
    private String id;
    private String movieId;
    private String userId;
    private Integer rating;
    private String content;
    private ReviewStatus status;
    private Integer reportCount;

    public enum ReviewStatus {
        APPROVED,
        PENDING,
        REJECTED
    }
}
