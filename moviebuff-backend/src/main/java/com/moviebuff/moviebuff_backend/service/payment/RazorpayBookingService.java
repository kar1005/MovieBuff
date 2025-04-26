package com.moviebuff.moviebuff_backend.service.payment;

import com.moviebuff.moviebuff_backend.exception.BadRequestException;
import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import com.moviebuff.moviebuff_backend.model.booking.Booking;
import com.moviebuff.moviebuff_backend.model.booking.Booking.BookingSeat;
import com.moviebuff.moviebuff_backend.repository.interfaces.bookings.IBookingRepository;
import com.moviebuff.moviebuff_backend.service.show.IShowService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RazorpayBookingService implements IPaymentService {

    private final IBookingRepository bookingRepository;
    private final Random random = new Random();
    private final IShowService showService;
    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

/**
     * Generates a short receipt ID for Razorpay
     * The receipt ID must be no more than 40 characters
     * 
     * @param bookingId The booking ID to reference
     * @return A short receipt ID
     */
    private String generateShortReceiptId(String bookingId) {
        // Format: order_YYYYMMDD_HHMMSS_RND where RND is a 4-digit random number
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String randomSuffix = String.format("%04d", random.nextInt(10000));
        
        // This format keeps the receipt ID well under 40 characters
        return "order_" + timestamp + "_" + randomSuffix;
    }

    /**
     * Initiates a payment for a booking
     * 
     * @param bookingId The booking ID
     * @param amount The amount to be paid
     * @param currency The currency (default INR)
     * @return Map containing order details
     */
    @Override
    @Transactional
    public Map<String, Object> initiatePayment(String bookingId, double amount, String currency) {
        try {
            // Check if booking exists
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

            // Validate booking status
            if (booking.getStatus() != Booking.BookingStatus.PAYMENT_PENDING) {
                throw new BadRequestException("Booking is not in PAYMENT_PENDING status");
            }

            // Create Razorpay client
            RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            // Convert amount to paise/cents (Razorpay requires amount in smallest currency unit)
            int amountInSmallestUnit = (int) (amount * 100);

            // Generate a short receipt ID that won't exceed 40 characters
            String receiptId = generateShortReceiptId(bookingId);
            log.info("Generated receipt ID: {} for booking: {}", receiptId, bookingId);

            // Create order request
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInSmallestUnit);
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", receiptId); // Using our shortened receipt ID
            orderRequest.put("payment_capture", 1); // Auto capture payment

            // Optional: Add notes for reference
            JSONObject notes = new JSONObject();
            notes.put("bookingId", bookingId);
            notes.put("customerName", booking.getUserId()); // Use user ID or actual name if available
            notes.put("movieTitle", booking.getMovieTitle());
            orderRequest.put("notes", notes);

            // Create order
            Order order = razorpayClient.orders.create(orderRequest);

            // Get order ID
            String orderId = order.get("id");

            // Update booking with Razorpay order ID
            if (booking.getPaymentDetails() == null) {
                Booking.PaymentDetails paymentDetails = new Booking.PaymentDetails();
                paymentDetails.setPaymentId(orderId);
                booking.setPaymentDetails(paymentDetails);
            } else {
                booking.getPaymentDetails().setPaymentId(orderId);
            }
            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);

            // Return payment details
            Map<String, Object> response = new HashMap<>();
            response.put("orderId", orderId);
            response.put("amount", amount);
            response.put("currency", currency);
            response.put("bookingId", bookingId);
            response.put("key", razorpayKeyId);

            return response;
        } catch (RazorpayException e) {
            log.error("Error initiating payment with Razorpay: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to initiate payment: " + e.getMessage());
        }
    }

    /**
     * Verifies a payment and updates booking status
     * 
     * @param paymentData Map containing Razorpay payment data
     * @return The updated booking
     */
    @Override
    @Transactional
    public Booking verifyPayment(Map<String, String> paymentData) {
        try {
            // Extract payment data
            String razorpayOrderId = paymentData.get("razorpayOrderId");
            String razorpayPaymentId = paymentData.get("razorpayPaymentId");
            String razorpaySignature = paymentData.get("razorpaySignature");
            String bookingId = paymentData.get("bookingId");

            if (razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null || bookingId == null) {
                throw new BadRequestException("Invalid payment data. Missing required fields.");
            }

            // Get booking
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

            // Verify signature
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", razorpayOrderId);
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", razorpaySignature);

            // Verify the payment signature
            boolean isValidSignature = Utils.verifyPaymentSignature(options, razorpayKeySecret);

            if (!isValidSignature) {
                throw new BadRequestException("Invalid payment signature");
            }

            // Update booking status to CONFIRMED
            booking.setStatus(Booking.BookingStatus.CONFIRMED);
            List<String> seatIds = booking.getSeats().stream()
    .map(BookingSeat::getSeatId)
    .collect(Collectors.toList());

// Call the service to update seat status
showService.updateSeatAvailability(booking.getShowId(), seatIds, false);




            // Update payment details
            if (booking.getPaymentDetails() == null) {
                Booking.PaymentDetails paymentDetails = new Booking.PaymentDetails();
                paymentDetails.setPaymentId(razorpayPaymentId);
                paymentDetails.setTransactionId(razorpayPaymentId);
                paymentDetails.setMethod(Booking.PaymentMethod.CREDIT_CARD); // Default or get from UI
                paymentDetails.setStatus(Booking.PaymentStatus.SUCCESS);
                paymentDetails.setPaymentTime(LocalDateTime.now());
                paymentDetails.setPaymentGateway("Razorpay");

                // Create payment attempt
                Booking.PaymentDetails.PaymentAttempt attempt = new Booking.PaymentDetails.PaymentAttempt();
                attempt.setAttemptTime(LocalDateTime.now());
                attempt.setStatus(Booking.PaymentStatus.SUCCESS);
                paymentDetails.setAttempts(java.util.Collections.singletonList(attempt));

                booking.setPaymentDetails(paymentDetails);
            } else {
                booking.getPaymentDetails().setPaymentId(razorpayPaymentId);
                booking.getPaymentDetails().setTransactionId(razorpayPaymentId);
                booking.getPaymentDetails().setStatus(Booking.PaymentStatus.SUCCESS);
                booking.getPaymentDetails().setPaymentTime(LocalDateTime.now());
            }

            // Initialize ticket status
            booking.setTicketStatus(Booking.TicketFulfillmentStatus.PENDING);
            booking.setUpdatedAt(LocalDateTime.now());

            // Save booking
            Booking updatedBooking = bookingRepository.save(booking);

            // Return updated booking
            return updatedBooking;
        } catch (RazorpayException e) {
            log.error("Error verifying payment with Razorpay: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to verify payment: " + e.getMessage());
        }
    }

    /**
     * Process refund for a booking
     * 
     * @param bookingId The booking ID
     * @param refundAmount The amount to refund
     * @param refundReason The reason for refund
     * @return The updated booking
     */
    @Override
    @Transactional
    public Booking processRefund(String bookingId, double refundAmount, String refundReason) {
        try {
            // Get booking
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

            // Validate booking status
            if (booking.getStatus() != Booking.BookingStatus.CANCELLED) {
                throw new BadRequestException("Only cancelled bookings can be refunded");
            }

            // Check if payment details exist
            if (booking.getPaymentDetails() == null || 
                booking.getPaymentDetails().getTransactionId() == null) {
                throw new BadRequestException("No payment details found for this booking");
            }

            // Create Razorpay client
            RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            // Convert refund amount to paise/cents
            int refundAmountInSmallestUnit = (int) (refundAmount * 100);

            // Build refund request
            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", refundAmountInSmallestUnit);

            // Add notes if reason is provided
            if (refundReason != null && !refundReason.isEmpty()) {
                JSONObject notes = new JSONObject();
                notes.put("reason", refundReason);
                refundRequest.put("notes", notes);
            }

            // Process refund
            com.razorpay.Refund refund = razorpayClient.payments.refund(
                booking.getPaymentDetails().getTransactionId(), refundRequest);

            // Update booking
            if (booking.getRefundDetails() == null) {
                Booking.RefundDetails refundDetails = new Booking.RefundDetails();
                refundDetails.setRefundId(refund.get("id"));
                refundDetails.setRefundAmount(refundAmount);
                refundDetails.setStatus(Booking.RefundStatus.PROCESSED);
                refundDetails.setRequestedAt(LocalDateTime.now());
                refundDetails.setProcessedAt(LocalDateTime.now());
                refundDetails.setRefundTransactionId(refund.get("id"));
                booking.setRefundDetails(refundDetails);
            } else {
                booking.getRefundDetails().setRefundId(refund.get("id"));
                booking.getRefundDetails().setRefundAmount(refundAmount);
                booking.getRefundDetails().setStatus(Booking.RefundStatus.PROCESSED);
                booking.getRefundDetails().setProcessedAt(LocalDateTime.now());
                booking.getRefundDetails().setRefundTransactionId(refund.get("id"));
            }

            // Update booking status
            booking.setStatus(Booking.BookingStatus.REFUNDED);
            booking.setUpdatedAt(LocalDateTime.now());

            // Save booking
            return bookingRepository.save(booking);
        } catch (RazorpayException e) {
            log.error("Error processing refund with Razorpay: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to process refund: " + e.getMessage());
        }
    }
}
        