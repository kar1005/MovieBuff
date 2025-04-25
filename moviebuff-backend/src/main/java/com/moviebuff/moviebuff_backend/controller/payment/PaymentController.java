package com.moviebuff.moviebuff_backend.controller.payment;

import com.moviebuff.moviebuff_backend.model.booking.Booking;
import com.moviebuff.moviebuff_backend.service.payment.IPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for payment operations
 */
@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PaymentController {

    private final IPaymentService paymentService;

    /**
     * Initiate a payment for a booking
     * 
     * @param paymentRequest Payment request data
     * @return Payment initialization response
     */
    @PostMapping("/booking/initiate")
    public ResponseEntity<Map<String, Object>> initiateBookingPayment(@RequestBody Map<String, Object> paymentRequest) {
        String bookingId = (String) paymentRequest.get("bookingId");
        double amount = Double.parseDouble(paymentRequest.get("amount").toString());
        String currency = (String) paymentRequest.getOrDefault("currency", "INR");

        Map<String, Object> response = paymentService.initiatePayment(bookingId, amount, currency);
        return ResponseEntity.ok(response);
    }

    /**
     * Verify a payment
     * 
     * @param verificationData Payment verification data
     * @return Updated booking details
     */
    @PostMapping("/booking/verify")
    public ResponseEntity<Booking> verifyBookingPayment(@RequestBody Map<String, String> verificationData) {
        Booking booking = paymentService.verifyPayment(verificationData);
        return ResponseEntity.ok(booking);
    }

    /**
     * Process a refund for a booking
     * 
     * @param refundRequest Refund request data
     * @return Updated booking details
     */
    @PostMapping("/booking/refund")
    public ResponseEntity<Booking> processBookingRefund(@RequestBody Map<String, Object> refundRequest) {
        String bookingId = (String) refundRequest.get("bookingId");
        double refundAmount = Double.parseDouble(refundRequest.get("amount").toString());
        String refundReason = (String) refundRequest.getOrDefault("reason", "Customer requested refund");

        Booking booking = paymentService.processRefund(bookingId, refundAmount, refundReason);
        return ResponseEntity.ok(booking);
    }

    /**
     * Get payment gateways (for frontend options)
     * 
     * @return List of payment gateways
     */
    @GetMapping("/gateways")
    public ResponseEntity<Map<String, Object>> getPaymentGateways() {
        // Return supported payment gateways and their configurations
        Map<String, Object> gateways = Map.of(
            "razorpay", Map.of(
                "name", "Razorpay",
                "isActive", true,
                "supportedMethods", new String[]{"CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "UPI", "WALLET"}
            )
        );
        
        return ResponseEntity.ok(gateways);
    }

    /**
     * Get payment analytics (for admin dashboard)
     */
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getPaymentAnalytics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        // Implement payment analytics logic
        // This would typically be a service method call
        
        // Placeholder response
        Map<String, Object> analytics = Map.of(
            "totalTransactions", 0,
            "totalAmount", 0.0,
            "successfulTransactions", 0,
            "failedTransactions", 0,
            "refundedTransactions", 0,
            "paymentMethodDistribution", Map.of(
                "CREDIT_CARD", 0,
                "DEBIT_CARD", 0,
                "NET_BANKING", 0,
                "UPI", 0,
                "WALLET", 0
            )
        );
        
        return ResponseEntity.ok(analytics);
    }
}