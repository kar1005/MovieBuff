package com.moviebuff.moviebuff_backend.service.payment;

import com.moviebuff.moviebuff_backend.model.booking.Booking;
import java.util.Map;

/**
 * Interface for payment processing services
 */
public interface IPaymentService {
    
    /**
     * Initiates a payment for a booking
     * 
     * @param bookingId The booking ID
     * @param amount The amount to be paid
     * @param currency The currency (default INR)
     * @return Map containing order details
     */
    Map<String, Object> initiatePayment(String bookingId, double amount, String currency);
    
    /**
     * Verifies a payment and updates booking status
     * 
     * @param paymentData Map containing payment verification data
     * @return The updated booking
     */
    Booking verifyPayment(Map<String, String> paymentData);
    
    /**
     * Process refund for a booking
     * 
     * @param bookingId The booking ID
     * @param refundAmount The amount to refund
     * @param refundReason The reason for refund
     * @return The updated booking
     */
    Booking processRefund(String bookingId, double refundAmount, String refundReason);
}
