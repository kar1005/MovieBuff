package com.moviebuff.moviebuff_backend.repository.interfaces.bookings;

import com.moviebuff.moviebuff_backend.model.booking.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IBookingRepository extends MongoRepository<Booking, String> {

    Optional<Booking> findByBookingNumber(String bookingNumber);
    
    List<Booking> findByUserIdOrderByShowTimeDesc(String userId);
    
    List<Booking> findByShowId(String showId);
    
    List<Booking> findByStatus(Booking.BookingStatus status);
    
    List<Booking> findByMovieId(String movieId);
    
    List<Booking> findByTheaterId(String theaterId);
    
    List<Booking> findByStatusAndMovieId(Booking.BookingStatus status, String movieId);
    
    List<Booking> findByStatusAndTheaterId(Booking.BookingStatus status, String theaterId);
    
    List<Booking> findByMovieIdAndTheaterId(String movieId, String theaterId);
    
    List<Booking> findByStatusAndMovieIdAndTheaterId(Booking.BookingStatus status, String movieId, String theaterId);
    
    @Query("{'showTime': {$gt: ?0}}")
    List<Booking> findUpcomingBookings(LocalDateTime now);
    
    @Query("{'userId': ?0, 'showTime': {$gt: ?1}}")
    List<Booking> findUserUpcomingBookings(String userId, LocalDateTime now);
    
    @Query("{'movieId': ?0, 'status': ?1}")
    List<Booking> findByMovieIdAndStatus(String movieId, Booking.BookingStatus status);
    
    @Query("{'theaterId': ?0, 'status': ?1}")
    List<Booking> findByTheaterIdAndStatus(String theaterId, Booking.BookingStatus status);
    
    @Query("{'showId': ?0, 'status': ?1}")
    List<Booking> findByShowIdAndStatus(String showId, Booking.BookingStatus status);
    
    @Query(value = "{'userId': ?0}", count = true)
    long countByUserId(String userId);
    
    @Query(value = "{'userId': ?0, 'appliedCoupon.code': ?1}", count = true)
    long countByUserIdAndAppliedCouponCode(String userId, String couponCode);
    
    @Query("{'createdAt': {$gte: ?0, $lte: ?1}}")
    List<Booking> findBookingsInDateRange(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("{'status': ?0, 'createdAt': {$gte: ?1, $lte: ?2}}")
    List<Booking> findBookingsByStatusInDateRange(Booking.BookingStatus status, LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("{'movieId': ?0, 'status': ?1, 'createdAt': {$gte: ?2, $lte: ?3}}")
    List<Booking> findBookingsByMovieAndStatusInDateRange(String movieId, Booking.BookingStatus status, 
                                                       LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("{'theaterId': ?0, 'status': ?1, 'createdAt': {$gte: ?2, $lte: ?3}}")
    List<Booking> findBookingsByTheaterAndStatusInDateRange(String theaterId, Booking.BookingStatus status, 
                                                         LocalDateTime startDate, LocalDateTime endDate);
}