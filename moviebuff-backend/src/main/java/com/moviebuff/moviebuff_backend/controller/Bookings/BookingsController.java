package com.moviebuff.moviebuff_backend.controller.Bookings;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.moviebuff.moviebuff_backend.model.booking.Booking;
import com.moviebuff.moviebuff_backend.service.booking.IBookingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingsController {
    @Autowired
    private IBookingService bookingService;

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings(
            @RequestParam(required = false) Booking.BookingStatus status,
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) String theaterId) {
        return ResponseEntity.ok(bookingService.getAllBookings(status, movieId, theaterId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getUserBookings(@PathVariable String userId) {
        return ResponseEntity.ok(bookingService.getUserBookings(userId));
    }
    
    @GetMapping("/show/{showId}")
    public ResponseEntity<List<Booking>> getShowBookings(@PathVariable String showId) {
        return ResponseEntity.ok(bookingService.getShowBookings(showId));
    }
    
    @GetMapping("/number/{bookingNumber}")
    public ResponseEntity<Booking> getBookingByNumber(@PathVariable String bookingNumber) {
        return ResponseEntity.ok(bookingService.getBookingByNumber(bookingNumber));
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody Booking booking) {
        return ResponseEntity.ok(bookingService.createBooking(booking));
    }
    
    @PostMapping("/initiate")
    public ResponseEntity<Booking> initiateBooking(@Valid @RequestBody Map<String, Object> bookingData) {
        return ResponseEntity.ok(bookingService.initiateBooking(bookingData));
    }
    
    @PostMapping("/confirm")
    public ResponseEntity<Booking> confirmBooking(@Valid @RequestBody Map<String, Object> paymentData) {
        return ResponseEntity.ok(bookingService.confirmBooking(paymentData));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(
            @PathVariable String id, 
            @Valid @RequestBody Booking booking) {
        return ResponseEntity.ok(bookingService.updateBooking(id, booking));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable String id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(
            @PathVariable String id,
            @RequestBody Map<String, String> cancelData) {
        String reason = cancelData.get("reason");
        String cancelledBy = cancelData.get("cancelledBy");
        return ResponseEntity.ok(bookingService.cancelBooking(id, reason, cancelledBy));
    }
    
    @PostMapping("/{id}/request-refund")
    public ResponseEntity<Booking> requestRefund(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.requestRefund(id));
    }
    
    @PostMapping("/{id}/process-refund")
    public ResponseEntity<Booking> processRefund(
            @PathVariable String id,
            @RequestBody Map<String, Object> refundData) {
        return ResponseEntity.ok(bookingService.processRefund(id, refundData));
    }
    
    @PostMapping("/{id}/generate-ticket")
    public ResponseEntity<Booking> generateTicket(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.generateTicket(id));
    }
    
    @GetMapping("/{id}/qr-code")
    public ResponseEntity<Map<String, String>> getTicketQRCode(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.getTicketQRCode(id));
    }
    
    @PostMapping("/{id}/send-notification")
    public ResponseEntity<Booking> sendTicketNotification(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> notificationOptions) {
        Boolean email = notificationOptions.getOrDefault("email", false);
        Boolean sms = notificationOptions.getOrDefault("sms", false);
        return ResponseEntity.ok(bookingService.sendTicketNotification(id, email, sms));
    }
    
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getBookingAnalytics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) String theaterId) {
        return ResponseEntity.ok(bookingService.getBookingAnalytics(startDate, endDate, movieId, theaterId));
    }
    
    @GetMapping("/check-in/{bookingNumber}")
    public ResponseEntity<Booking> checkInBooking(@PathVariable String bookingNumber) {
        return ResponseEntity.ok(bookingService.checkInBooking(bookingNumber));
    }
}