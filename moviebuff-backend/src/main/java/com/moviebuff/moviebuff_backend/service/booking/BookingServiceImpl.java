package com.moviebuff.moviebuff_backend.service.booking;

import com.moviebuff.moviebuff_backend.exception.BadRequestException;
import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import com.moviebuff.moviebuff_backend.model.booking.Booking;
import com.moviebuff.moviebuff_backend.model.coupon.Coupon;
import com.moviebuff.moviebuff_backend.model.movie.Movie;
import com.moviebuff.moviebuff_backend.model.show.Show;
import com.moviebuff.moviebuff_backend.model.theater.Theater;
import com.moviebuff.moviebuff_backend.repository.interfaces.bookings.IBookingRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.movie.MovieRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.show.IShowRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.theater.ITheaterRepository;
import com.moviebuff.moviebuff_backend.service.coupon.ICouponService;
// import com.moviebuff.moviebuff_backend.service.Email.EmailService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
// import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.mongodb.core.query.Query;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.mongodb.core.query.Query;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements IBookingService {

    private final IBookingRepository bookingRepository;
    private final IShowRepository showRepository;
    private final MovieRepository movieRepository;
    private final ITheaterRepository theaterRepository;
    private final ICouponService couponService;
    // private final EmailService emailService;
    private final MongoTemplate mongoTemplate;

    // Generate unique booking number
    private String generateBookingNumber() {
        String prefix = "MB";
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(6);
        String random = String.valueOf(new Random().nextInt(10000));
        return prefix + timestamp + random;
    }

    @Override
    public List<Booking> getAllBookings(Booking.BookingStatus status, String movieId, String theaterId) {
        if (status != null && movieId != null && theaterId != null) {
            return bookingRepository.findByStatusAndMovieIdAndTheaterId(status, movieId, theaterId);
        } else if (status != null && movieId != null) {
            return bookingRepository.findByStatusAndMovieId(status, movieId);
        } else if (status != null && theaterId != null) {
            return bookingRepository.findByStatusAndTheaterId(status, theaterId);
        } else if (movieId != null && theaterId != null) {
            return bookingRepository.findByMovieIdAndTheaterId(movieId, theaterId);
        } else if (status != null) {
            return bookingRepository.findByStatus(status);
        } else if (movieId != null) {
            return bookingRepository.findByMovieId(movieId);
        } else if (theaterId != null) {
            return bookingRepository.findByTheaterId(theaterId);
        }
        return bookingRepository.findAll();
    }

    @Override
    @Cacheable(value = "bookings", key = "#id")
    public Booking getBookingById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    @Override
    @Cacheable(value = "bookings", key = "'number:' + #bookingNumber")
    public Booking getBookingByNumber(String bookingNumber) {
        return bookingRepository.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with number: " + bookingNumber));
    }

    @Override
    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByUserIdOrderByShowTimeDesc(userId);
    }

    @Override
    public List<Booking> getShowBookings(String showId) {
        return bookingRepository.findByShowId(showId);
    }

    @Override
    @Transactional
    public Booking createBooking(Booking booking) {
        // Generate booking number if not provided
        if (booking.getBookingNumber() == null) {
            booking.setBookingNumber(generateBookingNumber());
        }
        
        // Set initial status if not set
        if (booking.getStatus() == null) {
            booking.setStatus(Booking.BookingStatus.INITIATED);
        }
        
        // Set ticket status
        if (booking.getTicketStatus() == null) {
            booking.setTicketStatus(Booking.TicketFulfillmentStatus.PENDING);
        }
        
        // Set timestamps
        LocalDateTime now = LocalDateTime.now();
        booking.setCreatedAt(now);
        booking.setUpdatedAt(now);
        
        // Calculate totals
        booking.calculateTotals();
        
        return bookingRepository.save(booking);
    }

    @Override
    @Transactional
    @CacheEvict(value = "bookings", key = "#id")
    public Booking updateBooking(String id, Booking booking) {
        Booking existingBooking = getBookingById(id);
        
        // Check if booking can be updated (only INITIATED and PAYMENT_PENDING can be updated)
        if (existingBooking.getStatus() != Booking.BookingStatus.INITIATED && 
            existingBooking.getStatus() != Booking.BookingStatus.PAYMENT_PENDING) {
            throw new BadRequestException("Cannot update booking with status: " + existingBooking.getStatus());
        }
        
        // Update only allowed fields
        booking.setId(id);
        booking.setBookingNumber(existingBooking.getBookingNumber());
        booking.setCreatedAt(existingBooking.getCreatedAt());
        booking.setUpdatedAt(LocalDateTime.now());
        
        // Recalculate totals
        booking.calculateTotals();
        
        return bookingRepository.save(booking);
    }

    @Override
    @Transactional
    @CacheEvict(value = "bookings", key = "#id")
    public void deleteBooking(String id) {
        Booking booking = getBookingById(id);
        
        // Only allow deletion of INITIATED, PAYMENT_PENDING or EXPIRED bookings
        if (booking.getStatus() != Booking.BookingStatus.INITIATED && 
            booking.getStatus() != Booking.BookingStatus.PAYMENT_PENDING &&
            booking.getStatus() != Booking.BookingStatus.EXPIRED) {
            throw new BadRequestException("Cannot delete booking with status: " + booking.getStatus());
        }
        
        // Release the seats
        releaseBookedSeats(booking.getShowId(), booking.getSeats().stream()
        .map(Booking.BookingSeat::getSeatId)
        .collect(Collectors.toList()));
        
        bookingRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Booking initiateBooking(Map<String, Object> bookingData) {
        // Extract booking data
        String userId = (String) bookingData.get("userId");
        String showId = (String) bookingData.get("showId");
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> seatData = (List<Map<String, Object>>) bookingData.get("seats");
        
        String couponCode = (String) bookingData.get("couponCode");
        
        // Validate show
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        // Check if show is available for booking
        if (show.getStatus() != Show.ShowStatus.OPEN && 
            show.getStatus() != Show.ShowStatus.FILLINGFAST && 
            show.getStatus() != Show.ShowStatus.FEWSEATSLEFT) {
            throw new BadRequestException("Show is not available for booking: " + show.getStatus());
        }
        
        // Check if show time is in the future
        if (show.getShowTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot book for a show that has already started");
        }
        
        // Get movie and theater details
        Movie movie = movieRepository.findById(show.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));
        
        Theater theater = theaterRepository.findById(show.getTheaterId())
                .orElseThrow(() -> new ResourceNotFoundException("Theater not found"));
        
        // Validate and block the selected seats
        List<String> seatIds = seatData.stream()
                .map(seat -> (String) seat.get("seatId"))
                .collect(Collectors.toList());
        
        if (!checkAndBlockSeats(showId, seatIds)) {
            throw new BadRequestException("One or more selected seats are not available");
        }
        
        // Create booking object
        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setShowId(showId);
        booking.setBookingNumber(generateBookingNumber());
        
        // Set movie and theater details
        booking.setMovieId(movie.getId());
        booking.setMovieTitle(movie.getTitle());
        booking.setTheaterId(theater.getId());
        booking.setTheaterName(theater.getName());
        
        // Find screen details
        Optional<Theater.Screen> screen = theater.getScreens().stream()
                .filter(s -> s.getScreenNumber().equals(show.getScreenNumber()))
                .findFirst();
        
        booking.setScreenNumber(screen.map(s -> s.getScreenName()).orElse("Screen " + show.getScreenNumber()));
        booking.setShowTime(show.getShowTime());
        booking.setExperience(show.getExperience());
        booking.setLanguage(show.getLanguage());
        
        // Process seats
        List<Booking.BookingSeat> bookingSeats = new ArrayList<>();
        double subtotal = 0.0;
        
        for (Map<String, Object> seat : seatData) {
            String seatId = (String) seat.get("seatId");
            String category = (String) seat.get("category");
            int row = (Integer) seat.get("row");
            int column = (Integer) seat.get("column");
            
            // Get pricing for this seat category
            Show.PricingTier pricing = show.getPricing().get(category);
            if (pricing == null) {
                releaseBookedSeats(showId, seatIds); // Release all seats on error
                throw new BadRequestException("Invalid seat category: " + category);
            }
            
            Booking.BookingSeat bookingSeat = new Booking.BookingSeat();
            bookingSeat.setSeatId(seatId);
            bookingSeat.setRow(row);
            bookingSeat.setColumn(column);
            bookingSeat.setCategory(category);
            bookingSeat.setBasePrice(pricing.getBasePrice());
            bookingSeat.setFinalPrice(pricing.getFinalPrice());
            
            bookingSeats.add(bookingSeat);
            subtotal += pricing.getFinalPrice();
        }
        
        booking.setSeats(bookingSeats);
        booking.setTotalSeats(bookingSeats.size());
        booking.setSubtotalAmount(subtotal);
        
        // Apply coupon if provided
        double discountAmount = 0.0;
        if (couponCode != null && !couponCode.isEmpty()) {
            // Validate coupon
            Map<String, Object> couponValidation = couponService.validateCoupon(
                    couponCode, userId, movie.getId(), theater.getId(), 
                    show.getExperience(), theater.getLocation().getCity(), subtotal);
            
            if ((Boolean) couponValidation.get("valid")) {
                Coupon coupon = (Coupon) couponValidation.get("coupon");
                discountAmount = (Double) couponValidation.get("discount");
                
                Booking.CouponApplied appliedCoupon = new Booking.CouponApplied();
                appliedCoupon.setCouponId(coupon.getId());
                appliedCoupon.setCode(coupon.getCode());
                appliedCoupon.setDiscount(discountAmount);
                appliedCoupon.setType(coupon.getType() == Coupon.CouponType.PERCENTAGE ? 
                        Booking.CouponApplied.CouponType.PERCENTAGE : 
                        Booking.CouponApplied.CouponType.FIXED);
                
                booking.setAppliedCoupon(appliedCoupon);
            }
        }
        
        booking.setDiscountAmount(discountAmount);
        
        // Set additional charges (e.g., convenience fee)
        double additionalCharges = subtotal * 0.05; // 5% convenience fee
        booking.setAdditionalCharges(additionalCharges);
        
        // Calculate total amount
        booking.setTotalAmount(subtotal - discountAmount + additionalCharges);
        
        // Set initial booking status
        booking.setStatus(Booking.BookingStatus.PAYMENT_PENDING);
        
        // Set ticket status
        booking.setTicketStatus(Booking.TicketFulfillmentStatus.PENDING);
        
        // Set timestamps
        LocalDateTime now = LocalDateTime.now();
        booking.setCreatedAt(now);
        booking.setUpdatedAt(now);
        
        return bookingRepository.save(booking);
    }

    @Override
    @Transactional
    @CacheEvict(value = "bookings", key = "#result.id")
    public Booking confirmBooking(Map<String, Object> paymentData) {
        String bookingId = (String) paymentData.get("bookingId");
        String paymentId = (String) paymentData.get("paymentId");
        String paymentMethod = (String) paymentData.get("paymentMethod");
        String transactionId = (String) paymentData.get("transactionId");
        
        Booking booking = getBookingById(bookingId);
        
        // Validate booking status
        if (booking.getStatus() != Booking.BookingStatus.PAYMENT_PENDING) {
            throw new BadRequestException("Booking is not in PAYMENT_PENDING status");
        }
        
        // Create payment details
        Booking.PaymentDetails paymentDetails = new Booking.PaymentDetails();
        paymentDetails.setPaymentId(paymentId);
        paymentDetails.setMethod(Booking.PaymentMethod.valueOf(paymentMethod));
        paymentDetails.setStatus(Booking.PaymentStatus.SUCCESS);
        paymentDetails.setPaymentTime(LocalDateTime.now());
        paymentDetails.setTransactionId(transactionId);
        paymentDetails.setPaymentGateway("Razorpay"); // Can be parameterized
        
        Booking.PaymentDetails.PaymentAttempt attempt = new Booking.PaymentDetails.PaymentAttempt();
        attempt.setAttemptTime(LocalDateTime.now());
        attempt.setStatus(Booking.PaymentStatus.SUCCESS);
        
        paymentDetails.setAttempts(Collections.singletonList(attempt));
        
        booking.setPaymentDetails(paymentDetails);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setUpdatedAt(LocalDateTime.now());
        
        // Convert blocked seats to booked
        confirmBlockedSeats(booking.getShowId(), booking.getSeats().stream()
                .map(Booking.BookingSeat::getSeatId)
                .collect(Collectors.toList()));
        
        // Update movie and show statistics
        updateStatistics(booking);
        
        // Generate QR code
        booking.generateQRCode();
        
        // Save updated booking
        Booking confirmedBooking = bookingRepository.save(booking);
        
        // Trigger ticket generation
        generateTicket(confirmedBooking.getId());
        
        return confirmedBooking;
    }

    @Override
    @Transactional
    @CacheEvict(value = "bookings", key = "#id")
    public Booking cancelBooking(String id, String reason, String cancelledBy) {
        Booking booking = getBookingById(id);
        
        // Check if booking can be cancelled
        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new BadRequestException("Only confirmed bookings can be cancelled");
        }
        
        // Check if show time has passed
        if (booking.getShowTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot cancel booking for a show that has already started");
        }
        
        // Cancel booking
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationReason(reason);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancelledBy(cancelledBy);
        booking.setUpdatedAt(LocalDateTime.now());
        
        // Release seats
        releaseBookedSeats(booking.getShowId(), booking.getSeats().stream()
                .map(Booking.BookingSeat::getSeatId)
                .collect(Collectors.toList()));
        
        return bookingRepository.save(booking);
    }

    @Override
    @Transactional
    @CacheEvict(value = "bookings", key = "#id")
    public Booking requestRefund(String id) {
        Booking booking = getBookingById(id);
        
        // Check if booking is cancelled
        if (booking.getStatus() != Booking.BookingStatus.CANCELLED) {
            throw new BadRequestException("Only cancelled bookings can request refund");
        }
        
        // Check if refund already exists
        if (booking.getRefundDetails() != null) {
            throw new BadRequestException("Refund already processed or pending");
        }
        
        // Create refund details
        Booking.RefundDetails refundDetails = new Booking.RefundDetails();
        refundDetails.setRefundId(UUID.randomUUID().toString());
        
        // Calculate refund amount (may apply cancellation policy)
        double refundAmount = booking.getTotalAmount();
        
        // If cancellation is within 24 hours of show, refund 75%
        if (booking.getShowTime().minusHours(24).isBefore(LocalDateTime.now())) {
            refundAmount *= 0.75;
        }
        
        refundDetails.setRefundAmount(refundAmount);
        refundDetails.setStatus(Booking.RefundStatus.PENDING);
        refundDetails.setRequestedAt(LocalDateTime.now());
        
        booking.setRefundDetails(refundDetails);
        booking.setUpdatedAt(LocalDateTime.now());
        
        return bookingRepository.save(booking);
    }

    @Override
    @Transactional
    @CacheEvict(value = "bookings", key = "#id")
    public Booking processRefund(String id, Map<String, Object> refundData) {
        Booking booking = getBookingById(id);
        
        // Check if refund is pending
        if (booking.getRefundDetails() == null || 
            booking.getRefundDetails().getStatus() != Booking.RefundStatus.PENDING) {
            throw new BadRequestException("No pending refund found for this booking");
        }
        
        String refundTransactionId = (String) refundData.get("transactionId");
        String refundStatus = (String) refundData.get("status");
        
        // Update refund details
        booking.getRefundDetails().setRefundTransactionId(refundTransactionId);
        booking.getRefundDetails().setStatus(Booking.RefundStatus.valueOf(refundStatus));
        booking.getRefundDetails().setProcessedAt(LocalDateTime.now());
        
        // Update booking status if refund successful
        if (Booking.RefundStatus.valueOf(refundStatus) == Booking.RefundStatus.PROCESSED) {
            booking.setStatus(Booking.BookingStatus.REFUNDED);
        }
        
        booking.setUpdatedAt(LocalDateTime.now());
        
        return bookingRepository.save(booking);
    }

    @Override
    @Transactional
    @CacheEvict(value = "bookings", key = "#id")
    public Booking generateTicket(String id) {
        Booking booking = getBookingById(id);
        
        // Check if booking is confirmed
        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new BadRequestException("Cannot generate ticket for unconfirmed booking");
        }
        
        // Generate QR code if not already generated
        if (booking.getQrCodeUrl() == null) {
            booking.generateQRCode();
        }
        
        // Update ticket status
        booking.setTicketStatus(Booking.TicketFulfillmentStatus.GENERATED);
        booking.setUpdatedAt(LocalDateTime.now());
        
        return bookingRepository.save(booking);
    }

    @Override
    public Map<String, String> getTicketQRCode(String id) {
        Booking booking = getBookingById(id);
        
        // Check if booking is confirmed and ticket is generated
        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED || 
            booking.getTicketStatus() == Booking.TicketFulfillmentStatus.PENDING) {
            throw new BadRequestException("Ticket not available for this booking");
        }
        
        Map<String, String> qrCodeData = new HashMap<>();
        qrCodeData.put("qrCodeUrl", booking.getQrCodeUrl());
        qrCodeData.put("bookingNumber", booking.getBookingNumber());
        
        return qrCodeData;
    }

    @Override
    @Transactional
    @CacheEvict(value = "bookings", key = "#id")
    public Booking sendTicketNotification(String id, Boolean email, Boolean sms) {
        Booking booking = getBookingById(id);
        
        // Check if booking is confirmed and ticket is generated
        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED || 
            booking.getTicketStatus() == Booking.TicketFulfillmentStatus.PENDING) {
            throw new BadRequestException("Cannot send notification for unconfirmed booking or pending ticket");
        }
        
        // Send email notification if requested
        if (Boolean.TRUE.equals(email)) {
            // Call email service (implementation details would depend on your email service)
            // emailService.sendTicketEmail(booking);
            booking.setEmailSent(true);
        }
        
        // Send SMS notification if requested
        if (Boolean.TRUE.equals(sms)) {
            // Call SMS service (implementation details would depend on your SMS service)
            // smsService.sendTicketSMS(booking);
            booking.setSmsSent(true);
        }
        
        // Update notification status
        booking.setLastNotificationSentAt(LocalDateTime.now());
        
        // Update ticket status if necessary
        if (booking.getEmailSent() || booking.getSmsSent()) {
            booking.setTicketStatus(Booking.TicketFulfillmentStatus.DELIVERED);
        }
        
        booking.setUpdatedAt(LocalDateTime.now());
        
        return bookingRepository.save(booking);
    }

    @Override
    @Transactional
    public Booking checkInBooking(String bookingNumber) {
        Booking booking = getBookingByNumber(bookingNumber);
        
        // Check if booking is confirmed
        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new BadRequestException("Cannot check in an unconfirmed booking");
        }
        
        // Check if show time is valid for check-in (within 2 hours before and after show time)
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(booking.getShowTime().minusHours(2)) || 
            now.isAfter(booking.getShowTime().plusHours(2))) {
            throw new BadRequestException("Check-in is only available 2 hours before and after show time");
        }
        
        // Update ticket status
        booking.setTicketStatus(Booking.TicketFulfillmentStatus.CHECKED_IN);
        booking.setUpdatedAt(now);
        
        return bookingRepository.save(booking);
    }

    @Override
    public Map<String, Object> getBookingAnalytics(String startDate, String endDate, String movieId, String theaterId) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start = startDate != null ? 
                LocalDate.parse(startDate, formatter).atStartOfDay() : 
                LocalDate.now().minusMonths(1).atStartOfDay();
        
        LocalDateTime end = endDate != null ? 
                LocalDate.parse(endDate, formatter).atTime(23, 59, 59) : 
                LocalDateTime.now();
    
        Map<String, Object> analytics = new HashMap<>();
    
        // Base criteria (no status filter)
        Criteria baseCriteria = Criteria.where("createdAt").gte(start).lte(end);
    
        if (movieId != null) {
            baseCriteria = baseCriteria.and("movieId").is(movieId);
        }
    
        if (theaterId != null) {
            baseCriteria = baseCriteria.and("theaterId").is(theaterId);
        }
    
        // Total bookings
        long totalBookings = mongoTemplate.count(new Query(baseCriteria), Booking.class);
        analytics.put("totalBookings", totalBookings);
    
        // Confirmed bookings
        Criteria confirmedCriteria = new Criteria().andOperator(
                baseCriteria, Criteria.where("status").is(Booking.BookingStatus.CONFIRMED)
        );
        long confirmedBookings = mongoTemplate.count(new Query(confirmedCriteria), Booking.class);
        analytics.put("confirmedBookings", confirmedBookings);
    
        // Cancelled bookings
        Criteria cancelledCriteria = new Criteria().andOperator(
                baseCriteria, Criteria.where("status").is(Booking.BookingStatus.CANCELLED)
        );
        long cancelledBookings = mongoTemplate.count(new Query(cancelledCriteria), Booking.class);
        analytics.put("cancelledBookings", cancelledBookings);
    
        // Total revenue from confirmed bookings
        Aggregation revenueAgg = Aggregation.newAggregation(
                Aggregation.match(confirmedCriteria),
                Aggregation.group().sum("totalAmount").as("totalRevenue")
        );
    
        AggregationResults<Map> revenueResults = mongoTemplate.aggregate(revenueAgg, Booking.class, Map.class);
        double totalRevenue = revenueResults.getMappedResults().isEmpty() ? 
                0.0 : ((Number) revenueResults.getMappedResults().get(0).get("totalRevenue")).doubleValue();
        analytics.put("totalRevenue", totalRevenue);
    
        // Average ticket price
        Aggregation ticketAgg = Aggregation.newAggregation(
                Aggregation.match(confirmedCriteria),
                Aggregation.unwind("seats"),
                Aggregation.group().avg("seats.finalPrice").as("averageTicketPrice")
        );
    
        AggregationResults<Map> ticketResults = mongoTemplate.aggregate(ticketAgg, Booking.class, Map.class);
        double averageTicketPrice = ticketResults.getMappedResults().isEmpty() ? 
                0.0 : ((Number) ticketResults.getMappedResults().get(0).get("averageTicketPrice")).doubleValue();
        analytics.put("averageTicketPrice", averageTicketPrice);
    
        // Bookings by show hour
        Aggregation timeAgg = Aggregation.newAggregation(
                Aggregation.match(confirmedCriteria),
                Aggregation.project().andExpression("hour(showTime)").as("hour"),
                Aggregation.group("hour").count().as("count"),
                Aggregation.sort(org.springframework.data.domain.Sort.Direction.ASC, "_id")
        );
    
        AggregationResults<Map> timeResults = mongoTemplate.aggregate(timeAgg, Booking.class, Map.class);
        Map<String, Long> bookingsByHour = new HashMap<>();
        timeResults.getMappedResults().forEach(result -> {
            int hour = (Integer) result.get("_id");
            long count = ((Number) result.get("count")).longValue();
            bookingsByHour.put(String.valueOf(hour), count);
        });
        analytics.put("bookingsByHour", bookingsByHour);
    
        // Bookings by date
        Aggregation dateAgg = Aggregation.newAggregation(
                Aggregation.match(confirmedCriteria),
                Aggregation.project().andExpression("dateToString('%Y-%m-%d', showTime)").as("date"),
                Aggregation.group("date").count().as("count")
        );
    
        AggregationResults<Map> dateResults = mongoTemplate.aggregate(dateAgg, Booking.class, Map.class);
        Map<String, Long> bookingsByDate = new HashMap<>();
        dateResults.getMappedResults().forEach(result -> {
            String date = (String) result.get("_id");
            long count = ((Number) result.get("count")).longValue();
            bookingsByDate.put(date, count);
        });
        analytics.put("bookingsByDate", bookingsByDate);
    
        // Bookings by payment method
        Aggregation paymentAgg = Aggregation.newAggregation(
                Aggregation.match(confirmedCriteria),
                Aggregation.group("paymentDetails.method").count().as("count")
        );
    
        AggregationResults<Map> paymentResults = mongoTemplate.aggregate(paymentAgg, Booking.class, Map.class);
        Map<String, Long> bookingsByPaymentMethod = new HashMap<>();
        paymentResults.getMappedResults().forEach(result -> {
            String method = result.get("_id") != null ? result.get("_id").toString() : "UNKNOWN";
            long count = ((Number) result.get("count")).longValue();
            bookingsByPaymentMethod.put(method, count);
        });
        analytics.put("bookingsByPaymentMethod", bookingsByPaymentMethod);
    
        // Coupon usage from confirmed bookings
        Criteria couponCriteria = new Criteria().andOperator(
                baseCriteria,
                Criteria.where("status").is(Booking.BookingStatus.CONFIRMED),
                Criteria.where("appliedCoupon").exists(true)
        );
        long couponUsage = mongoTemplate.count(new Query(couponCriteria), Booking.class);
        analytics.put("bookingsWithCoupon", couponUsage);
    
        // Cancellation rate
        double cancellationRate = totalBookings > 0 ?
                (double) cancelledBookings / totalBookings : 0.0;
        analytics.put("cancellationRate", cancellationRate);
    
        return analytics;
    }
    
    
    // Helper methods
    
    private boolean checkAndBlockSeats(String showId, List<String> seatIds) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        // Check if all seats are available
        boolean allAvailable = show.getSeatStatus().stream()
                .filter(seat -> seatIds.contains(seat.getSeatId()))
                .allMatch(seat -> seat.getStatus() == Show.SeatAvailability.AVAILABLE);
        
        if (!allAvailable) {
            return false;
        }
        
        // Block seats
        for (Show.SeatStatus seat : show.getSeatStatus()) {
            if (seatIds.contains(seat.getSeatId())) {
                seat.setStatus(Show.SeatAvailability.BLOCKED);
                seat.setLastUpdated(LocalDateTime.now());
            }
        }
        
        // Update available seats count
        show.updateAvailabilityCounters();
        
        // Update show status
        show.updateShowStatus();
        
        // Save show
        showRepository.save(show);
        
        return true;
    }
    
    private void confirmBlockedSeats(String showId, List<String> seatIds) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        // Change status from BLOCKED to BOOKED
        for (Show.SeatStatus seat : show.getSeatStatus()) {
            if (seatIds.contains(seat.getSeatId()) && seat.getStatus() == Show.SeatAvailability.BLOCKED) {
                seat.setStatus(Show.SeatAvailability.BOOKED);
                seat.setLastUpdated(LocalDateTime.now());
            }
        }
        
        // Update available seats count
        show.updateAvailabilityCounters();
        
        // Update show status
        show.updateShowStatus();
        
        // Update popularity score
        show.calculatePopularityScore();
        
        // Save show
        showRepository.save(show);
    }
    
    private void releaseBookedSeats(String showId, List<String> seatIds) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        // Change status from BOOKED or BLOCKED to AVAILABLE
        for (Show.SeatStatus seat : show.getSeatStatus()) {
            if (seatIds.contains(seat.getSeatId()) && 
                (seat.getStatus() == Show.SeatAvailability.BOOKED || 
                 seat.getStatus() == Show.SeatAvailability.BLOCKED)) {
                seat.setStatus(Show.SeatAvailability.AVAILABLE);
                seat.setLastUpdated(LocalDateTime.now());
                seat.setBookingId(null);
            }
        }
        
        // Update available seats count
        show.updateAvailabilityCounters();
        
        // Update show status
        show.updateShowStatus();
        
        // Save show
        showRepository.save(show);
    }
    
    private void updateStatistics(Booking booking) {
        // Update movie statistics
        Movie movie = movieRepository.findById(booking.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + booking.getMovieId()));
        
        Movie.MovieStatistics stats = movie.getStatistics();
        if (stats == null) {
            stats = new Movie.MovieStatistics();
            stats.setTotalBookings(0);
            stats.setRevenue(0.0);
            stats.setPopularityScore(0.0);
        }
        
        stats.setTotalBookings(stats.getTotalBookings() + 1);
        stats.setRevenue(stats.getRevenue() + booking.getTotalAmount());
        
        // Calculate new popularity score (example formula)
        double score = stats.getPopularityScore();
        score = (score * 0.9) + (10.0 * 0.1); // Weighted average with new booking
        stats.setPopularityScore(score);
        
        movie.setStatistics(stats);
        movieRepository.save(movie);
        
        // Update show statistics
        Show show = showRepository.findById(booking.getShowId())
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + booking.getShowId()));
        
        // Increment booking attempts
        show.setBookingAttempts(show.getBookingAttempts() + 1);
        
        // Update popularity score
        show.calculatePopularityScore();
        
        showRepository.save(show);
    }

    @Override
    public List<Map<String, Object>> getReservedSeats(String showId) {
        // Verify the show exists
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        // Directly use the show's seatStatus list to find all blocked seats
        List<Map<String, Object>> reservedSeats = new ArrayList<>();
        
        for (Show.SeatStatus seat : show.getSeatStatus()) {
            if (seat.getStatus() == Show.SeatAvailability.BLOCKED) {
                Map<String, Object> seatInfo = new HashMap<>();
                
                // Add seat information
                seatInfo.put("seatId", seat.getSeatId());
                seatInfo.put("row", seat.getRow());
                seatInfo.put("column", seat.getColumn());
                seatInfo.put("category", seat.getCategory());
                seatInfo.put("blockedAt", seat.getLastUpdated());
                seatInfo.put("bookingId", seat.getBookingId());
                
                reservedSeats.add(seatInfo);
            }
        }
        
        return reservedSeats;
    }
    
    @Override
    public List<Map<String, Object>> getBookedSeats(String showId) {
        // Verify the show exists
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        // Directly use the show's seatStatus list to find all booked seats
        List<Map<String, Object>> bookedSeats = new ArrayList<>();
        
        for (Show.SeatStatus seat : show.getSeatStatus()) {
            if (seat.getStatus() == Show.SeatAvailability.BOOKED) {
                Map<String, Object> seatInfo = new HashMap<>();
                
                // Add seat information
                seatInfo.put("seatId", seat.getSeatId());
                seatInfo.put("row", seat.getRow());
                seatInfo.put("column", seat.getColumn());
                seatInfo.put("category", seat.getCategory());
                seatInfo.put("bookingId", seat.getBookingId());
                
                // If there's a booking ID, fetch additional booking details
                if (seat.getBookingId() != null) {
                    Optional<Booking> bookingOpt = bookingRepository.findById(seat.getBookingId());
                    if (bookingOpt.isPresent()) {
                        Booking booking = bookingOpt.get();
                        seatInfo.put("bookingNumber", booking.getBookingNumber());
                        seatInfo.put("status", booking.getStatus());
                    }
                }
                
                bookedSeats.add(seatInfo);
            }
        }
        
        return bookedSeats;
    }

    @Override
    @Transactional
    public Booking finalizeBooking(String bookingId, Map<String, Object> paymentDetails) {
        // Step 1: Find and validate the booking
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));
        
        // Step 2: Check if booking is in the correct state to be finalized
        if (booking.getStatus() != Booking.BookingStatus.PAYMENT_PENDING) {
            throw new BadRequestException(
                "Booking with id: " + bookingId + 
                " cannot be finalized. Current status: " + booking.getStatus());
        }
        
        // Step 3: Extract payment details
        String paymentId = (String) paymentDetails.get("paymentId");
        String paymentMethod = (String) paymentDetails.get("paymentMethod");
        String transactionId = (String) paymentDetails.get("transactionId");
        String paymentGateway = (String) paymentDetails.getOrDefault("paymentGateway", "Razorpay");
        Double amount = Double.valueOf(paymentDetails.getOrDefault("amount", booking.getTotalAmount()).toString());
        
        if (paymentId == null || paymentMethod == null || transactionId == null) {
            throw new BadRequestException("Invalid payment details provided");
        }
        
        // Step 4: Validate amount matches
        if (Math.abs(amount - booking.getTotalAmount()) > 0.01) {
            throw new BadRequestException("Payment amount doesn't match booking amount");
        }
        
        // Step 5: Create payment details
        Booking.PaymentDetails payment = new Booking.PaymentDetails();
        payment.setPaymentId(paymentId);
        payment.setMethod(Booking.PaymentMethod.valueOf(paymentMethod));
        payment.setStatus(Booking.PaymentStatus.SUCCESS);
        payment.setPaymentTime(LocalDateTime.now());
        payment.setTransactionId(transactionId);
        payment.setPaymentGateway(paymentGateway);
        
        // Add payment attempt
        Booking.PaymentDetails.PaymentAttempt attempt = new Booking.PaymentDetails.PaymentAttempt();
        attempt.setAttemptTime(LocalDateTime.now());
        attempt.setStatus(Booking.PaymentStatus.SUCCESS);
        payment.setAttempts(Collections.singletonList(attempt));
        
        // Step 6: Update booking status and details
        booking.setPaymentDetails(payment);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setUpdatedAt(LocalDateTime.now());
        
        // Step 7: Convert blocked seats to booked
        confirmBlockedSeats(booking.getShowId(), booking.getSeats().stream()
                .map(Booking.BookingSeat::getSeatId)
                .collect(Collectors.toList()));
        
        // Step 8: Update movie and show statistics
        updateStatistics(booking);
        
        // Step 9: Generate QR code
        booking.generateQRCode();
        
        // Step 10: Save the updated booking
        Booking finalizedBooking = bookingRepository.save(booking);
        
        // Step 11: Send confirmation email/SMS (commented out for now)
        // try {
        //     if (booking.getUserId() != null) {
        //         User user = userRepository.findById(booking.getUserId())
        //             .orElse(null);
        //         if (user != null && user.getEmail() != null) {
        //             emailService.sendBookingConfirmation(user.getEmail(), finalizedBooking);
        //             booking.setEmailSent(true);
        //         }
        //     }
        // } catch (Exception e) {
        //     log.error("Failed to send confirmation email: {}", e.getMessage());
        // }
        
        return finalizedBooking;
    }


    @Override
    public Map<String, Object> reserveSeat(String showId, String seatId) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        // Find the seat in the show's seat status list
        Optional<Show.SeatStatus> seatStatus = show.getSeatStatus().stream()
                .filter(s -> s.getSeatId().equals(seatId))
                .findFirst();
        
        if (!seatStatus.isPresent()) {
            throw new ResourceNotFoundException("Seat not found with id: " + seatId);
        }
        
        // Check if the seat is available
        if (seatStatus.get().getStatus() != Show.SeatAvailability.AVAILABLE) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Seat is not available");
            response.put("currentStatus", seatStatus.get().getStatus());
            return response;
        }
        
        // Block the seat
        seatStatus.get().setStatus(Show.SeatAvailability.BLOCKED);
        seatStatus.get().setLastUpdated(LocalDateTime.now());
        
        // Update availability counters and show status
        show.updateAvailabilityCounters();
        show.updateShowStatus();
        
        // Save the updated show
        showRepository.save(show);
        
        // Return success response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Seat reserved successfully");
        response.put("showId", showId);
        response.put("seatId", seatId);
        response.put("reservationTime", LocalDateTime.now());
        
        return response;
    }
    @Override
    public Map<String, Object> releaseSeat(String showId, String seatId) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        // Find the seat in the show's seat status list
        Optional<Show.SeatStatus> seatStatus = show.getSeatStatus().stream()
                .filter(s -> s.getSeatId().equals(seatId))
                .findFirst();
        
        if (!seatStatus.isPresent()) {
            throw new ResourceNotFoundException("Seat not found with id: " + seatId);
        }
        
        // Check if the seat is blocked (only blocked seats can be released)
        if (seatStatus.get().getStatus() != Show.SeatAvailability.BLOCKED) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Seat is not in a blocked state");
            response.put("currentStatus", seatStatus.get().getStatus());
            return response;
        }
        
        // Release the seat
        seatStatus.get().setStatus(Show.SeatAvailability.AVAILABLE);
        seatStatus.get().setLastUpdated(LocalDateTime.now());
        seatStatus.get().setBookingId(null);
        
        // Update availability counters and show status
        show.updateAvailabilityCounters();
        show.updateShowStatus();
        
        // Save the updated show
        showRepository.save(show);
        
        // Return success response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Seat released successfully");
        response.put("showId", showId);
        response.put("seatId", seatId);
        response.put("releaseTime", LocalDateTime.now());
        
        return response;
    }
    @Override
    public Map<String, Object> releaseSeats(String showId, List<String> seatIds) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        List<String> releasedSeats = new ArrayList<>();
        List<String> failedSeats = new ArrayList<>();
        
        for (String seatId : seatIds) {
            // Find the seat in the show's seat status list
            Optional<Show.SeatStatus> seatStatus = show.getSeatStatus().stream()
                    .filter(s -> s.getSeatId().equals(seatId))
                    .findFirst();
            
            if (!seatStatus.isPresent()) {
                failedSeats.add(seatId);
                continue;
            }
            
            // Only release seats that are in BLOCKED state
            if (seatStatus.get().getStatus() == Show.SeatAvailability.BLOCKED) {
                seatStatus.get().setStatus(Show.SeatAvailability.AVAILABLE);
                seatStatus.get().setLastUpdated(LocalDateTime.now());
                seatStatus.get().setBookingId(null);
                releasedSeats.add(seatId);
            } else {
                failedSeats.add(seatId);
            }
        }
        
        // Update availability counters and show status if any seats were released
        if (!releasedSeats.isEmpty()) {
            show.updateAvailabilityCounters();
            show.updateShowStatus();
            showRepository.save(show);
        }
        
        // Return response with results
        Map<String, Object> response = new HashMap<>();
        response.put("success", !releasedSeats.isEmpty());
        response.put("releasedSeats", releasedSeats);
        response.put("failedSeats", failedSeats);
        response.put("showId", showId);
        response.put("releaseTime", LocalDateTime.now());
        
        return response;
    }
    @Override
    public Booking createTemporaryBooking(String showId) {
        // Validate the show
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        // Create a temporary booking object
        Booking tempBooking = new Booking();
        tempBooking.setShowId(showId);
        tempBooking.setBookingNumber(generateBookingNumber());
        tempBooking.setStatus(Booking.BookingStatus.INITIATED);
        tempBooking.setCreatedAt(LocalDateTime.now());
        tempBooking.setUpdatedAt(LocalDateTime.now());
        
        // Get movie and theater details for the booking
        Movie movie = movieRepository.findById(show.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));
        
        Theater theater = theaterRepository.findById(show.getTheaterId())
                .orElseThrow(() -> new ResourceNotFoundException("Theater not found"));
        
        // Set basic details
        tempBooking.setMovieId(movie.getId());
        tempBooking.setMovieTitle(movie.getTitle());
        tempBooking.setTheaterId(theater.getId());
        tempBooking.setTheaterName(theater.getName());
        tempBooking.setShowTime(show.getShowTime());
        tempBooking.setExperience(show.getExperience());
        tempBooking.setLanguage(show.getLanguage());
        
        // Set empty lists and initial values
        tempBooking.setSeats(new ArrayList<>());
        tempBooking.setTotalSeats(0);
        tempBooking.setSubtotalAmount(0.0);
        tempBooking.setDiscountAmount(0.0);
        tempBooking.setAdditionalCharges(0.0);
        tempBooking.setTotalAmount(0.0);
        
        // Set ticket status
        tempBooking.setTicketStatus(Booking.TicketFulfillmentStatus.PENDING);
        
        return bookingRepository.save(tempBooking);
    }

    @Override
    public Booking confirmReservation(String showId, List<String> seatIds, String bookingId, String userId) {
        // Get the booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));
        
        // Validate booking status
        if (booking.getStatus() != Booking.BookingStatus.INITIATED) {
            throw new BadRequestException("Booking is not in INITIATED status");
        }
    
        // Set the userId in the booking
        booking.setUserId(userId);
    
        // Validate show
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        // Get seat information from the show
        List<Booking.BookingSeat> bookingSeats = new ArrayList<>();
        double subtotal = 0.0;
        
        for (String seatId : seatIds) {
            // Find seat in the show's seat status
            Optional<Show.SeatStatus> seatStatus = show.getSeatStatus().stream()
                    .filter(s -> s.getSeatId().equals(seatId))
                    .findFirst();
            
            if (!seatStatus.isPresent()) {
                throw new ResourceNotFoundException("Seat not found with id: " + seatId);
            }
            
            // Check if seat is in BLOCKED status
            if (seatStatus.get().getStatus() != Show.SeatAvailability.BLOCKED) {
                throw new BadRequestException("Seat " + seatId + " is not in BLOCKED status");
            }
            
            // Get category and seat details from the seat status
            String category = seatStatus.get().getCategory();
            Integer row = seatStatus.get().getRow();
            Integer column = seatStatus.get().getColumn();
            
            // Get pricing for this seat category
            Show.PricingTier pricing = show.getPricing().get(category);
            if (pricing == null) {
                throw new BadRequestException("Invalid seat category: " + category);
            }
            
            // Create booking seat
            Booking.BookingSeat bookingSeat = new Booking.BookingSeat();
            bookingSeat.setSeatId(seatId);
            bookingSeat.setRow(row);
            bookingSeat.setColumn(column);
            bookingSeat.setCategory(category);
            bookingSeat.setBasePrice(pricing.getBasePrice());
            bookingSeat.setFinalPrice(pricing.getFinalPrice());
            
            bookingSeats.add(bookingSeat);
            subtotal += pricing.getFinalPrice();
            
            // Update seat status to link it to this booking
            seatStatus.get().setBookingId(bookingId);
        }
        
        // Update booking with seat and pricing information
        booking.setSeats(bookingSeats);
        booking.setTotalSeats(bookingSeats.size());
        booking.setSubtotalAmount(subtotal);
        
        // Calculate additional charges (e.g., convenience fee)
        double additionalCharges = subtotal * 0.05; // 5% convenience fee
        booking.setAdditionalCharges(additionalCharges);
        
        // Calculate total amount
        booking.setTotalAmount(subtotal + additionalCharges);
        
        // Update booking status
        booking.setStatus(Booking.BookingStatus.PAYMENT_PENDING);
        booking.setUpdatedAt(LocalDateTime.now());
        
        return bookingRepository.save(booking);
    }







    @Override
public Map<String, Object> reserveSeats(String showId, List<String> seatIds) {
    Show show = showRepository.findById(showId)
            .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
    
    List<String> reservedSeats = new ArrayList<>();
    List<String> failedSeats = new ArrayList<>();
    
    for (String seatId : seatIds) {
        // Find the seat in the show's seat status list
        Optional<Show.SeatStatus> seatStatus = show.getSeatStatus().stream()
                .filter(s -> s.getSeatId().equals(seatId))
                .findFirst();
        
        if (!seatStatus.isPresent()) {
            failedSeats.add(seatId);
            continue;
        }
        
        // Only reserve seats that are in AVAILABLE state
        if (seatStatus.get().getStatus() == Show.SeatAvailability.AVAILABLE) {
            seatStatus.get().setStatus(Show.SeatAvailability.BLOCKED);
            seatStatus.get().setLastUpdated(LocalDateTime.now());
            reservedSeats.add(seatId);
        } else {
            failedSeats.add(seatId);
        }
    }
    
    // Update availability counters and show status if any seats were reserved
    if (!reservedSeats.isEmpty()) {
        show.updateAvailabilityCounters();
        show.updateShowStatus();
        showRepository.save(show);
    }
    
    // Return response with results
    Map<String, Object> response = new HashMap<>();
    response.put("success", !reservedSeats.isEmpty());
    response.put("reservedSeats", reservedSeats);
    response.put("failedSeats", failedSeats);
    response.put("showId", showId);
    response.put("reservationTime", LocalDateTime.now());
    
    return response;
}

@Override
public void expireReservations(String showId) {
    Show show = showRepository.findById(showId)
            .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
    
    LocalDateTime expiryThreshold = LocalDateTime.now().minusMinutes(10); // Default 10 minutes timeout
    
    boolean hasExpiredSeats = false;
    
    // Find and expire any seats that have been blocked for too long
    for (Show.SeatStatus seat : show.getSeatStatus()) {
        if (seat.getStatus() == Show.SeatAvailability.BLOCKED && 
            seat.getLastUpdated() != null && 
            seat.getLastUpdated().isBefore(expiryThreshold)) {
            
            seat.setStatus(Show.SeatAvailability.AVAILABLE);
            seat.setLastUpdated(LocalDateTime.now());
            seat.setBookingId(null);
            hasExpiredSeats = true;
        }
    }
    
    // If any seats were expired, update counters and save the show
    if (hasExpiredSeats) {
        show.updateAvailabilityCounters();
        show.updateShowStatus();
        showRepository.save(show);
    }
    
    // Also expire any initiated bookings that haven't been completed
    List<Booking> expiredReservations = bookingRepository.findExpiredReservationsByShow(
            showId, expiryThreshold);
    
    for (Booking booking : expiredReservations) {
        booking.setStatus(Booking.BookingStatus.EXPIRED);
        booking.setUpdatedAt(LocalDateTime.now());
    }
    
    if (!expiredReservations.isEmpty()) {
        bookingRepository.saveAll(expiredReservations);
    }
}

@Override
public void scheduleReservationExpiry(String reservationId, int timeoutMinutes) {
    // In a production environment, you would use a task scheduler
    // For now, we'll set the expiry time in the booking record
    Booking booking = bookingRepository.findById(reservationId)
            .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));
    
    booking.setReservationExpiry(LocalDateTime.now().plusMinutes(timeoutMinutes));
    bookingRepository.save(booking);
    
    // In a real implementation, you might schedule a task:
    // taskScheduler.schedule(() -> {
    //     expireReservationIfStillActive(reservationId);
    // }, Instant.now().plusSeconds(timeoutMinutes * 60));
}

@Override
public Map<String, Boolean> checkSeatAvailability(String showId, List<String> seatIds) {
    Show show = showRepository.findById(showId)
            .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
    
    Map<String, Boolean> availabilityMap = new HashMap<>();
    
    for (String seatId : seatIds) {
        Optional<Show.SeatStatus> seatStatus = show.getSeatStatus().stream()
                .filter(s -> s.getSeatId().equals(seatId))
                .findFirst();
        
        if (seatStatus.isPresent()) {
            availabilityMap.put(seatId, seatStatus.get().getStatus() == Show.SeatAvailability.AVAILABLE);
        } else {
            availabilityMap.put(seatId, false); // Seat not found, so not available
        }
    }
    
    return availabilityMap;
}

@Override
public Map<String, Object> getReservationByToken(String token) {
    Optional<Booking> bookingOpt = bookingRepository.findByReservationToken(token);
    
    if (!bookingOpt.isPresent()) {
        throw new ResourceNotFoundException("Reservation not found with token: " + token);
    }
    
    Booking booking = bookingOpt.get();
    
    // Check if the reservation has expired
    if (booking.getReservationExpiry() != null && 
        booking.getReservationExpiry().isBefore(LocalDateTime.now())) {
        
        // Automatically expire the reservation
        booking.setStatus(Booking.BookingStatus.EXPIRED);
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);
        
        throw new BadRequestException("Reservation has expired");
    }
    
    Map<String, Object> reservationDetails = new HashMap<>();
    reservationDetails.put("bookingId", booking.getId());
    reservationDetails.put("showId", booking.getShowId());
    reservationDetails.put("movieTitle", booking.getMovieTitle());
    reservationDetails.put("theaterName", booking.getTheaterName());
    reservationDetails.put("showTime", booking.getShowTime());
    reservationDetails.put("status", booking.getStatus());
    
    if (booking.getSeats() != null) {
        reservationDetails.put("seats", booking.getSeats());
        reservationDetails.put("totalSeats", booking.getTotalSeats());
    }
    
    reservationDetails.put("createdAt", booking.getCreatedAt());
    reservationDetails.put("expiresAt", booking.getReservationExpiry());
    
    return reservationDetails;
}

// Implementation for expireAllReservations method
public void expireAllReservations() {
    LocalDateTime expiryThreshold = LocalDateTime.now().minusMinutes(10); // Default 10 minutes timeout
    
    // Find all shows with blocked seats that have expired
    List<Show> showsWithExpiredBlocks = showRepository.findShowsWithExpiredBlockedSeats(expiryThreshold);
    
    for (Show show : showsWithExpiredBlocks) {
        // Call the expireReservations method for each show
        expireReservations(show.getId());
    }
    
    // Also expire any payment pending bookings that have timed out
    List<Booking> expiredPaymentBookings = bookingRepository.findPaymentPendingExpiredBookings(expiryThreshold);
    
    for (Booking booking : expiredPaymentBookings) {
        booking.setStatus(Booking.BookingStatus.EXPIRED);
        booking.setUpdatedAt(LocalDateTime.now());
        
        // Release any seats associated with this booking
        releaseBookedSeats(booking.getShowId(), booking.getSeats().stream()
                .map(Booking.BookingSeat::getSeatId)
                .collect(Collectors.toList()));
    }
    
    if (!expiredPaymentBookings.isEmpty()) {
        bookingRepository.saveAll(expiredPaymentBookings);
    }
}

}