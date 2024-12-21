package com.moviebuff.moviebuff_backend.model.booking;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.moviebuff.moviebuff_backend.model.base.BaseEntity;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Document(collection = "bookings")
public class Booking extends BaseEntity {
    @Id
    private String id;
    private String userId;
    private String showId;
    private String bookingNumber;
    private List<BookingSeat> seats;
    private CouponApplied appliedCoupon;
    private Double totalAmount;
    private PaymentDetails paymentDetails;
    private BookingStatus status;

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingSeat {
        private Integer row;
        private Integer column;
        private String category;
        private Double price;
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CouponApplied {
        private String code;
        private Double discount;
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentDetails {
        private String paymentId;
        private String method;
        private String status;
    }

    public enum BookingStatus {
        CONFIRMED, CANCELLED
    }
}