package com.moviebuff.moviebuff_backend.scheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.moviebuff.moviebuff_backend.service.booking.IBookingService;

@Component
public class ReservationExpiryScheduler {
    @Autowired
    private IBookingService bookingService;
    
    // Run every minute to check for expired reservations
    @Scheduled(fixedRate = 60000)
    public void checkExpiredReservations() {
        // This will find and expire all reservations across all shows
        bookingService.expireAllReservations();
    }
}