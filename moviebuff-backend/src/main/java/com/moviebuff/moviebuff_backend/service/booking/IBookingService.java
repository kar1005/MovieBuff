package com.moviebuff.moviebuff_backend.service.booking;

import java.util.List;
import java.util.Map;
import com.moviebuff.moviebuff_backend.model.booking.Booking;

public interface IBookingService {
    // Basic CRUD operations
    List<Booking> getAllBookings(Booking.BookingStatus status, String movieId, String theaterId);
    Booking getBookingById(String id);
    Booking getBookingByNumber(String bookingNumber);
    List<Booking> getUserBookings(String userId);
    List<Booking> getShowBookings(String showId);
    Booking createBooking(Booking booking);
    Booking updateBooking(String id, Booking booking);
    void deleteBooking(String id);

    // Booking process operations
    Booking initiateBooking(Map<String, Object> bookingData);
    Booking confirmBooking(Map<String, Object> paymentData);

    // Booking management operations
    Booking cancelBooking(String id, String reason, String cancelledBy);
    Booking requestRefund(String id);
    Booking processRefund(String id, Map<String, Object> refundData);

    // Ticket operations
    Booking generateTicket(String id);
    Map<String, String> getTicketQRCode(String id);
    Booking sendTicketNotification(String id, Boolean email, Boolean sms);
    Booking checkInBooking(String bookingNumber);

    // Analytics
    Map<String, Object> getBookingAnalytics(String startDate, String endDate, String movieId, String theaterId);

    // Seat Booking
    List<Map<String, Object>> getBookedSeats(String showId);
    List<Map<String, Object>> getReservedSeats(String showId);

    Map<String, Object> reserveSeats(String showId, List<String> seatIds);
    Map<String, Object> reserveSeat(String showId, String seatId);
    
    Map<String, Object> releaseSeat(String showId, String seatId);
    Map<String, Object> releaseSeats(String showId, List<String> seatIds);

    void expireReservations(String showId);
    void scheduleReservationExpiry(String reservationId, int timeoutMinutes);
    
    Map<String, Boolean> checkSeatAvailability(String showId, List<String> seatIds);
    Map<String, Object> getReservationByToken(String token);

    Booking createTemporaryBooking(String showId);
    Booking confirmReservation(String showId, List<String> seatIds, String bookingId);
    Booking finalizeBooking(String bookingId, Map<String, Object> paymentDetails);
    void expireAllReservations();
    
}