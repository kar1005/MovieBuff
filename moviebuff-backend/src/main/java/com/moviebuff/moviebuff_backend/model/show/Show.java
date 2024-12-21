// src/main/java/com/moviebuff/model/show/Show.java
package com.moviebuff.moviebuff_backend.model.show;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.moviebuff.moviebuff_backend.model.base.BaseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "shows")
@EqualsAndHashCode(callSuper = true)
public class Show extends BaseEntity {
    @Id
    private String id;
    private String movieId;
    private String theaterId;
    private Integer screenNumber;
    private LocalDateTime showTime;
    private String language;
    private String experience;
    private Map<String, PricingTier> pricing;
    private Map<String, Boolean[]> seatAvailability;
    private ShowStatus status;

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PricingTier {
        private Double basePrice;
        private List<AdditionalCharge> additionalCharges;
        private Double finalPrice;
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdditionalCharge {
        private String type;
        private Double amount;
    }

    public enum ShowStatus {
        OPEN,
        FULL,
        CANCELLED
    }
}
