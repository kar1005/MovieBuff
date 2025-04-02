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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

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
        // Parse dates
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start = startDate != null ? 
                LocalDate.parse(startDate, formatter).atStartOfDay() : 
                LocalDate.now().minusMonths(1).atStartOfDay();
        
        LocalDateTime end = endDate != null ? 
                LocalDate.parse(endDate, formatter).atTime(23, 59, 59) : 
                LocalDateTime.now();
        
        Map<String, Object> analytics = new HashMap<>();
        
        // Build base criteria
        Criteria criteria = Criteria.where("createdAt").gte(start).lte(end);
        
        // Add movie filter
        if (movieId != null) {
            criteria = criteria.and("movieId").is(movieId);
        }
        
        // Add theater filter
        if (theaterId != null) {
            criteria = criteria.and("theaterId").is(theaterId);
        }
        
        // Total bookings
        long totalBookings = mongoTemplate.count(
                new org.springframework.data.mongodb.core.query.Query(criteria), 
                Booking.class);
        analytics.put("totalBookings", totalBookings);
        
        // Confirmed bookings
        Criteria confirmedCriteria = criteria.and("status").is(Booking.BookingStatus.CONFIRMED);
        long confirmedBookings = mongoTemplate.count(
                new org.springframework.data.mongodb.core.query.Query(confirmedCriteria), 
                Booking.class);
        analytics.put("confirmedBookings", confirmedBookings);
        
        // Cancelled bookings
        Criteria cancelledCriteria = criteria.and("status").is(Booking.BookingStatus.CANCELLED);
        long cancelledBookings = mongoTemplate.count(
                new org.springframework.data.mongodb.core.query.Query(cancelledCriteria), 
                Booking.class);
        analytics.put("cancelledBookings", cancelledBookings);
        
        // Total revenue from confirmed bookings
        Aggregation revenueAgg = Aggregation.newAggregation(
                Aggregation.match(confirmedCriteria),
                Aggregation.group().sum("totalAmount").as("totalRevenue")
        );
        
        AggregationResults<Map> revenueResults = mongoTemplate.aggregate(
                revenueAgg, Booking.class, Map.class);
        
        double totalRevenue = revenueResults.getMappedResults().isEmpty() ? 
                0.0 : (Double) revenueResults.getMappedResults().get(0).get("totalRevenue");
        analytics.put("totalRevenue", totalRevenue);
        
        // Average ticket price
        Aggregation ticketAgg = Aggregation.newAggregation(
                Aggregation.match(confirmedCriteria),
                Aggregation.unwind("seats"),
                Aggregation.group().avg("seats.finalPrice").as("averageTicketPrice")
        );
        
        AggregationResults<Map> ticketResults = mongoTemplate.aggregate(
                ticketAgg, Booking.class, Map.class);
        
        double averageTicketPrice = ticketResults.getMappedResults().isEmpty() ? 
                0.0 : (Double) ticketResults.getMappedResults().get(0).get("averageTicketPrice");
        analytics.put("averageTicketPrice", averageTicketPrice);
        
        // Bookings by show time (time of day distribution)
        Aggregation timeAgg = Aggregation.newAggregation(
                Aggregation.match(confirmedCriteria),
                Aggregation.project()
                        .andExpression("hour(showTime)").as("hour"),
                Aggregation.group("hour").count().as("count"),
                Aggregation.sort(org.springframework.data.domain.Sort.Direction.ASC, "_id")
        );
        
        AggregationResults<Map> timeResults = mongoTemplate.aggregate(
                timeAgg, Booking.class, Map.class);
        
        Map<String, Long> bookingsByHour = new HashMap<>();
        timeResults.getMappedResults().forEach(result -> {
            int hour = (Integer) result.get("_id");
            long count = (Long) result.get("count");
            bookingsByHour.put(String.valueOf(hour), count);
        });
        analytics.put("bookingsByHour", bookingsByHour);
        
        // Bookings by date
        Aggregation dateAgg = Aggregation.newAggregation(
                Aggregation.match(confirmedCriteria),
                Aggregation.project()
                        .andExpression("dateToString('%Y-%m-%d', showTime)").as("date"),
                Aggregation.group("date").count().as("count")
        );
        
        AggregationResults<Map> dateResults = mongoTemplate.aggregate(
                dateAgg, Booking.class, Map.class);
        
        Map<String, Long> bookingsByDate = new HashMap<>();
        dateResults.getMappedResults().forEach(result -> {
            String date = (String) result.get("_id");
            long count = (Long) result.get("count");
            bookingsByDate.put(date, count);
        });
        analytics.put("bookingsByDate", bookingsByDate);
        
        // Bookings by payment method
        Aggregation paymentAgg = Aggregation.newAggregation(
                Aggregation.match(confirmedCriteria),
                Aggregation.group("paymentDetails.method").count().as("count")
        );
        
        AggregationResults<Map> paymentResults = mongoTemplate.aggregate(
                paymentAgg, Booking.class, Map.class);
        
        Map<String, Long> bookingsByPaymentMethod = new HashMap<>();
        paymentResults.getMappedResults().forEach(result -> {
            String method = result.get("_id") != null ? result.get("_id").toString() : "UNKNOWN";
            long count = (Long) result.get("count");
            bookingsByPaymentMethod.put(method, count);
        });
        analytics.put("bookingsByPaymentMethod", bookingsByPaymentMethod);
        
        // Coupon usage
        Criteria couponCriteria = confirmedCriteria.and("appliedCoupon").exists(true);
        long couponUsage = mongoTemplate.count(
                new org.springframework.data.mongodb.core.query.Query(couponCriteria), 
                Booking.class);
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
}