package com.moviebuff.moviebuff_backend.controller.Bookings;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.moviebuff.moviebuff_backend.model.booking.Booking;
import com.moviebuff.moviebuff_backend.service.booking.IBookingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/bookings")
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

    // Check in a booking at the theater
    @GetMapping("/check-in/{bookingNumber}")
    public ResponseEntity<Booking> checkInBooking(@PathVariable String bookingNumber) {
        Booking booking = bookingService.checkInBooking(bookingNumber);
        return ResponseEntity.ok(booking);
    }

    // Get booking analytics
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getBookingAnalytics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) String theaterId) {
        return ResponseEntity.ok(bookingService.getBookingAnalytics(startDate, endDate, movieId, theaterId));
    }

    // Get all booked seats for a specific show
    @GetMapping("/show/{showId}/booked-seats")
    public ResponseEntity<List<Map<String, Object>>> getBookedSeats(@PathVariable String showId) {
        List<Map<String, Object>> bookedSeats = bookingService.getBookedSeats(showId);
        return ResponseEntity.ok(bookedSeats);
    }

    // Get all reserved (temporarily held) seats for a show
    @GetMapping("/show/{showId}/reserved-seats")
    public ResponseEntity<List<Map<String, Object>>> getReservedSeats(@PathVariable String showId) {
        List<Map<String, Object>> reservedSeats = bookingService.getReservedSeats(showId);
        return ResponseEntity.ok(reservedSeats);
    }

    // Reserve a single seat
    @PostMapping("/reserve")
    public ResponseEntity<Map<String, Object>> reserveSeat(@RequestBody Map<String, String> reservationData) {
        String showId = reservationData.get("showId");
        String seatId = reservationData.get("seatId");
        Map<String, Object> result = bookingService.reserveSeat(showId, seatId);
        return ResponseEntity.ok(result);
    }
    
    // Release a single reserved seat
    @PostMapping("/release")
    public ResponseEntity<Map<String, Object>> releaseSeat(@RequestBody Map<String, String> releaseData) {
        String showId = releaseData.get("showId");
        String seatId = releaseData.get("seatId");
        Map<String, Object> result = bookingService.releaseSeat(showId, seatId);
        return ResponseEntity.ok(result);
    }
    
    // Release multiple seats at once
    @PostMapping("/release-multiple")
    public ResponseEntity<Map<String, Object>> releaseSeats(@RequestBody Map<String, Object> releaseData) {
        String showId = (String) releaseData.get("showId");
        @SuppressWarnings("unchecked")
        List<String> seatIds = (List<String>) releaseData.get("seatIds");
        Map<String, Object> result = bookingService.releaseSeats(showId, seatIds);
        return ResponseEntity.ok(result);
    }
    
    // Create a temporary booking record
    @PostMapping("/create-temporary")
    public ResponseEntity<Booking> createTemporaryBooking(@RequestBody Map<String, String> bookingData) {
        String showId = bookingData.get("showId");
        Booking tempBooking = bookingService.createTemporaryBooking(showId);
        return new ResponseEntity<>(tempBooking, HttpStatus.CREATED);
    }
    
    // Confirm seat reservation - transition from reserved to booked
    @PostMapping("/confirm-reservation")
    public ResponseEntity<Booking> confirmReservation(@RequestBody Map<String, Object> reservationData) {
        String showId = (String) reservationData.get("showId");
        String bookingId = (String) reservationData.get("bookingId");
        @SuppressWarnings("unchecked")
        List<String> seatIds = (List<String>) reservationData.get("seatIds");
        Booking booking = bookingService.confirmReservation(showId, seatIds, bookingId);
        return ResponseEntity.ok(booking);
    }
    
    // Finalize booking after payment
    @PostMapping("/finalize/{bookingId}")
    public ResponseEntity<Booking> finalizeBooking(
            @PathVariable String bookingId,
            @RequestBody Map<String, Object> paymentDetails) {
        Booking finalizedBooking = bookingService.finalizeBooking(bookingId, paymentDetails);
        return ResponseEntity.ok(finalizedBooking);
    }


    // Reserve multiple seats at once
    @PostMapping("/reserve-multiple")
    public ResponseEntity<Map<String, Object>> reserveSeats(@RequestBody Map<String, Object> reservationData) {
        String showId = (String) reservationData.get("showId");
        @SuppressWarnings("unchecked")
        List<String> seatIds = (List<String>) reservationData.get("seatIds");
        Map<String, Object> result = bookingService.reserveSeats(showId, seatIds);
        return ResponseEntity.ok(result);
    }

    // Check seat availability
    @PostMapping("/check-availability")
    public ResponseEntity<Map<String, Boolean>> checkSeatAvailability(@RequestBody Map<String, Object> requestData) {
        String showId = (String) requestData.get("showId");
        @SuppressWarnings("unchecked")
        List<String> seatIds = (List<String>) requestData.get("seatIds");
        Map<String, Boolean> availability = bookingService.checkSeatAvailability(showId, seatIds);
        return ResponseEntity.ok(availability);
    }

    // Get reservation details by token
    @GetMapping("/reservation/{token}")
    public ResponseEntity<Map<String, Object>> getReservationByToken(@PathVariable String token) {
        Map<String, Object> reservation = bookingService.getReservationByToken(token);
        return ResponseEntity.ok(reservation);
    }

    // Manually expire reservations for a show (admin operation)
    @PostMapping("/expire-reservations/{showId}")
    public ResponseEntity<Void> expireReservations(@PathVariable String showId) {
        bookingService.expireReservations(showId);
        return ResponseEntity.ok().build();
    }

    // Schedule reservation expiry
    @PostMapping("/schedule-expiry")
    public ResponseEntity<Void> scheduleReservationExpiry(@RequestBody Map<String, Object> expiryData) {
        String reservationId = (String) expiryData.get("reservationId");
        Integer timeoutMinutes = (Integer) expiryData.get("timeoutMinutes");
        bookingService.scheduleReservationExpiry(reservationId, timeoutMinutes);
        return ResponseEntity.ok().build();
    }

    // Admin endpoint to manually expire all reservations
    @PostMapping("/expire-all-reservations")
    public ResponseEntity<Void> expireAllReservations() {
        bookingService.expireAllReservations();
        return ResponseEntity.ok().build();
    }
}