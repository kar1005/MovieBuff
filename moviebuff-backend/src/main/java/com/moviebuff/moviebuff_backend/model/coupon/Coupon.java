// src/main/java/com/moviebuff/model/coupon/Coupon.java
package com.moviebuff.moviebuff_backend.model.coupon;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.moviebuff.moviebuff_backend.model.base.BaseEntity;

import java.time.LocalDateTime;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "coupons")
@EqualsAndHashCode(callSuper = true)
public class Coupon extends BaseEntity {
    @Id
    private String id;
    private String code;
    private CouponType type;
    private Double value;
    private Double minBookingAmount;
    private Double maxDiscount;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Integer usageLimit;
    private Integer usageCount;
    private CouponStatus status;

    public enum CouponType {
        PERCENTAGE,
        FIXED
    }

    public enum CouponStatus {
        ACTIVE,
        EXPIRED,
        DEPLETED
    }
}