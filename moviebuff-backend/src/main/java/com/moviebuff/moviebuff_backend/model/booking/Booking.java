// src/main/java/com/moviebuff/model/booking/Booking.java
package com.moviebuff.moviebuff_backend.model.booking;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    @Indexed
    private String showId;
    
    @Indexed(unique = true)
    private String bookingNumber;
    
    // Enhanced booking details with more information
    private String movieId;
    private String movieTitle;
    private String theaterId;
    private String theaterName;
    private String screenNumber;
    private LocalDateTime showTime;
    private String experience;
    private String language;
    
    // Seats information
    private List<BookingSeat> seats;
    private Integer totalSeats;
    
    // Pricing information
    private CouponApplied appliedCoupon;
    private Double subtotalAmount;
    private Double discountAmount;
    private Double additionalCharges;
    private Double totalAmount;
    
    // Payment details
    private PaymentDetails paymentDetails;
    
    // Booking status tracking
    @Indexed
    private BookingStatus status;
    private String cancellationReason;
    private LocalDateTime cancelledAt;
    private String cancelledBy; // User or System
    private RefundDetails refundDetails;
    
    // Ticket fulfillment tracking
    private TicketFulfillmentStatus ticketStatus;
    private String qrCodeUrl;
    private Boolean emailSent;
    private Boolean smsSent;
    private LocalDateTime lastNotificationSentAt;

    private String reservationToken;
    private String reservationId;
    private LocalDateTime reservationExpiry;
    
    // Audit fields
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingSeat {
        private Integer row;
        private Integer column;
        private String seatId;        // E.g., "A1", "B5"
        private String category;      // Maps to theater section category
        private Double basePrice;
        private Double finalPrice;    // After any seat-specific adjustments
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CouponApplied {
        private String couponId;
        private String code;
        private Double discount;
        private CouponType type;
        
        public enum CouponType {
            PERCENTAGE,
            FIXED
        }
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentDetails {
        private String paymentId;
        private PaymentMethod method;
        private PaymentStatus status;
        private LocalDateTime paymentTime;
        private String transactionId;
        private String paymentGateway;  // Razorpay, Stripe, etc.
        private List<PaymentAttempt> attempts;
        
        @Data
        @SuperBuilder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class PaymentAttempt {
            private LocalDateTime attemptTime;
            private PaymentStatus status;
            private String failureReason;
            private String gatewayResponse;
        }
    }
    
    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefundDetails {
        private String refundId;
        private Double refundAmount;
        private RefundStatus status;
        private LocalDateTime requestedAt;
        private LocalDateTime processedAt;
        private String refundTransactionId;
    }

    public enum BookingStatus {
        INITIATED,      // Booking started but not confirmed
        PAYMENT_PENDING,// Seats blocked, awaiting payment
        CONFIRMED,      // Payment successful, booking confirmed
        CANCELLED,      // Booking was cancelled
        REFUNDED,       // Booking was cancelled and refunded
        EXPIRED         // Payment not completed in time
    }
    
    public enum PaymentMethod {
        CREDIT_CARD,
        DEBIT_CARD,
        NET_BANKING,
        UPI,
        WALLET,
        CASH
    }
    
    public enum PaymentStatus {
        PENDING,
        SUCCESS,
        FAILED,
        REFUNDED
    }
    
    public enum RefundStatus {
        PENDING,
        PROCESSED,
        FAILED,
        CANCELLED
    }
    
    public enum TicketFulfillmentStatus {
        PENDING,        // Ticket not yet generated
        GENERATED,      // Ticket/QR generated but not delivered
        DELIVERED,      // Ticket/QR emailed or sent via SMS
        CHECKED_IN,     // Customer has checked in at theater
        EXPIRED         // Show has ended
    }
    
    // Helper methods
    public void calculateTotals() {
        // Calculate number of seats
        this.totalSeats = this.seats != null ? this.seats.size() : 0;
        
        // Calculate subtotal from seats
        double subtotal = 0.0;
        if (this.seats != null) {
            for (BookingSeat seat : this.seats) {
                subtotal += seat.getFinalPrice();
            }
        }
        this.subtotalAmount = subtotal;
        
        // Apply discount if coupon is present
        this.discountAmount = this.appliedCoupon != null ? this.appliedCoupon.getDiscount() : 0.0;
        
        // Calculate final total
        this.totalAmount = this.subtotalAmount - this.discountAmount + this.additionalCharges;
    }
    
    // Method to generate QR code URL
    public void generateQRCode() {
        // Logic to generate QR code containing booking information
        // In a real implementation, this might call a service to generate and store the QR
        this.qrCodeUrl = "/api/bookings/qr/" + this.bookingNumber;
    }
    
    // Method to update ticket status based on show time
    public void updateTicketStatus(LocalDateTime currentTime) {
        if (this.status != BookingStatus.CONFIRMED) {
            return;
        }
        
        if (currentTime.isAfter(this.showTime)) {
            this.ticketStatus = TicketFulfillmentStatus.EXPIRED;
        } else if (this.emailSent || this.smsSent) {
            this.ticketStatus = TicketFulfillmentStatus.DELIVERED;
        } else if (this.qrCodeUrl != null) {
            this.ticketStatus = TicketFulfillmentStatus.GENERATED;
        } else {
            this.ticketStatus = TicketFulfillmentStatus.PENDING;
        }
    }
    
    // Method to cancel booking
    public void cancelBooking(String reason, String cancelledBy) {
        this.status = BookingStatus.CANCELLED;
        this.cancellationReason = reason;
        this.cancelledAt = LocalDateTime.now();
        this.cancelledBy = cancelledBy;
    }
}