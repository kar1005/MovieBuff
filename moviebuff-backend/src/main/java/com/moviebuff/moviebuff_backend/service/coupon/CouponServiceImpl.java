package com.moviebuff.moviebuff_backend.service.coupon;

import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import com.moviebuff.moviebuff_backend.model.coupon.Coupon;
import com.moviebuff.moviebuff_backend.model.user.User;
import com.moviebuff.moviebuff_backend.repository.interfaces.coupon.ICouponRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.bookings.IBookingRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.user.IUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
// import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
public class CouponServiceImpl implements ICouponService {

    private final ICouponRepository couponRepository;
    private final IBookingRepository bookingRepository;
    private final IUserRepository userRepository;

    @Override
    public List<Coupon> getAllCoupons(Coupon.CouponStatus status, String campaignId) {
        if (status != null && campaignId != null) {
            return couponRepository.findByStatusAndCampaignId(status, campaignId);
        } else if (status != null) {
            return couponRepository.findByStatus(status);
        } else if (campaignId != null) {
            return couponRepository.findByCampaignId(campaignId);
        }
        return couponRepository.findAll();
    }

    @Override
    @Cacheable(value = "coupons", key = "#id")
    public Coupon getCouponById(String id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
    }

    @Override
    @Cacheable(value = "coupons", key = "'code:' + #code")
    public Coupon getCouponByCode(String code) {
        return couponRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with code: " + code));
    }

    @Override
    @Transactional
    public Coupon createCoupon(Coupon coupon) {
        // Validate coupon code uniqueness
        if (couponRepository.existsByCode(coupon.getCode())) {
            throw new IllegalArgumentException("Coupon code already exists: " + coupon.getCode());
        }
        
        // Set default values if not provided
        if (coupon.getStatus() == null) {
            coupon.setStatus(Coupon.CouponStatus.ACTIVE);
        }
        
        if (coupon.getUsageCount() == null) {
            coupon.setUsageCount(0);
        }
        
        // Set creation timestamp
        LocalDateTime now = LocalDateTime.now();
        
        // Validate dates
        if (coupon.getValidFrom() == null) {
            coupon.setValidFrom(now);
        }
        
        if (coupon.getValidUntil() == null) {
            // Default expiry is 30 days from now if not specified
            coupon.setValidUntil(now.plusDays(30));
        }
        
        if (coupon.getValidUntil().isBefore(coupon.getValidFrom())) {
            throw new IllegalArgumentException("Valid until date must be after valid from date");
        }
        
        return couponRepository.save(coupon);
    }

    @Override
    @Transactional
    @CacheEvict(value = "coupons", key = "#id")
    public Coupon updateCoupon(String id, Coupon coupon) {
        Coupon existingCoupon = getCouponById(id);
        
        // Check if code is being changed and validate uniqueness if it is
        if (!existingCoupon.getCode().equals(coupon.getCode()) && 
            couponRepository.existsByCode(coupon.getCode())) {
            throw new IllegalArgumentException("Coupon code already exists: " + coupon.getCode());
        }
        
        // Preserve existing fields that shouldn't be updated
        coupon.setId(id);
        coupon.setUsageCount(existingCoupon.getUsageCount());
        
        // Validate dates
        if (coupon.getValidUntil().isBefore(coupon.getValidFrom())) {
            throw new IllegalArgumentException("Valid until date must be after valid from date");
        }
        
        return couponRepository.save(coupon);
    }

    @Override
    @Transactional
    @CacheEvict(value = "coupons", key = "#id")
    public void deleteCoupon(String id) {
        if (!couponRepository.existsById(id)) {
            throw new ResourceNotFoundException("Coupon not found with id: " + id);
        }
        couponRepository.deleteById(id);
    }

    @Override
    @Transactional
    @CacheEvict(value = "coupons", key = "#id")
    public Coupon updateCouponStatus(String id, Coupon.CouponStatus status, String reason) {
        Coupon coupon = getCouponById(id);
        coupon.setStatus(status);
        
        if (reason != null && !reason.isEmpty()) {
            coupon.setRejectionReason(reason);
        }
        
        return couponRepository.save(coupon);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> validateCoupon(String code, String userId, String movieId, 
                                               String theaterId, String experience, String city, 
                                               Double bookingAmount) {
        Map<String, Object> result = new HashMap<>();
        result.put("valid", false);
        result.put("message", "Invalid coupon");
        
        try {
            Coupon coupon = getCouponByCode(code);
            
            // Basic validation checks
            if (!coupon.isValid()) {
                result.put("message", "Coupon is not active or has expired");
                return result;
            }
            
            // Minimum booking amount check
            if (coupon.getMinBookingAmount() != null && bookingAmount < coupon.getMinBookingAmount()) {
                result.put("message", "Booking amount does not meet minimum requirement of " + coupon.getMinBookingAmount());
                return result;
            }
            
            // Movie/Theater/Experience/City specific validation
            if (!coupon.isApplicableToMovie(movieId)) {
                result.put("message", "Coupon is not applicable to this movie");
                return result;
            }
            
            if (!coupon.isApplicableToTheater(theaterId)) {
                result.put("message", "Coupon is not applicable to this theater");
                return result;
            }
            
            if (!coupon.isApplicableToExperience(experience)) {
                result.put("message", "Coupon is not applicable to this experience type");
                return result;
            }
            
            if (!coupon.isApplicableToCity(city)) {
                result.put("message", "Coupon is not applicable in this city");
                return result;
            }
            
            // User-specific validation
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            
            boolean isFirstBooking = bookingRepository.countByUserId(userId) == 0;
            
            // Use LocalDateTime.now() as fallback for User registration date
            LocalDateTime userRegistrationDate = LocalDateTime.now();
            
            if (!coupon.isApplicableToUser(userId, userRegistrationDate, isFirstBooking)) {
                result.put("message", "Coupon is not applicable to this user");
                return result;
            }
            
            // Check user usage limit
            if (coupon.getUsagePerUser() != null) {
                long userUsageCount = bookingRepository.countByUserIdAndAppliedCouponCode(userId, code);
                if (userUsageCount >= coupon.getUsagePerUser()) {
                    result.put("message", "You have reached the usage limit for this coupon");
                    return result;
                }
            }
            
            // Coupon is valid, calculate discount
            double discount = coupon.calculateDiscount(bookingAmount);
            
            // Prepare success response
            result.put("valid", true);
            result.put("message", "Coupon applied successfully");
            result.put("discount", discount);
            result.put("finalAmount", bookingAmount - discount);
            result.put("coupon", coupon);
            
            return result;
            
        } catch (ResourceNotFoundException e) {
            result.put("message", "Coupon not found");
            return result;
        } catch (Exception e) {
            log.error("Error validating coupon", e);
            result.put("message", "Error validating coupon: " + e.getMessage());
            return result;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Coupon> getUserApplicableCoupons(String userId, String movieId, 
                                                 String theaterId, Double bookingAmount) {
        // Get all active coupons
        List<Coupon> activeCoupons = couponRepository.findByStatus(Coupon.CouponStatus.ACTIVE);
        
        // Get user details
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        boolean isFirstBooking = bookingRepository.countByUserId(userId) == 0;
        
        // Use LocalDateTime.now() as fallback for User registration date
        LocalDateTime userRegistrationDate = LocalDateTime.now();
        
        LocalDateTime now = LocalDateTime.now();
        
        // Filter coupons based on applicability
        return activeCoupons.stream()
                .filter(coupon -> now.isAfter(coupon.getValidFrom()) && now.isBefore(coupon.getValidUntil()))
                .filter(coupon -> coupon.getMinBookingAmount() == null || bookingAmount >= coupon.getMinBookingAmount())
                .filter(coupon -> coupon.isApplicableToMovie(movieId))
                .filter(coupon -> coupon.isApplicableToTheater(theaterId))
                .filter(coupon -> coupon.isApplicableToUser(userId, userRegistrationDate, isFirstBooking))
                .filter(coupon -> {
                    // Check user usage limit if applicable
                    if (coupon.getUsagePerUser() != null) {
                        long userUsageCount = bookingRepository.countByUserIdAndAppliedCouponCode(userId, coupon.getCode());
                        return userUsageCount < coupon.getUsagePerUser();
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCouponAnalytics(String campaignId, String startDate, String endDate) {
        Map<String, Object> analytics = new HashMap<>();
        
        // Parse dates if provided
        LocalDateTime startDateTime = null;
        LocalDateTime endDateTime = null;
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        
        if (startDate != null && !startDate.isEmpty()) {
            startDateTime = LocalDate.parse(startDate, formatter).atStartOfDay();
        }
        
        if (endDate != null && !endDate.isEmpty()) {
            endDateTime = LocalDate.parse(endDate, formatter).atTime(23, 59, 59);
        }
        
        // Get coupons based on campaign and date range
        List<Coupon> filteredCoupons;
        
        if (campaignId != null && !campaignId.isEmpty()) {
            filteredCoupons = couponRepository.findByCampaignId(campaignId);
        } else {
            filteredCoupons = couponRepository.findAll();
        }
        
        // Apply date filters if provided
        if (startDateTime != null) {
            final LocalDateTime startDateFinal = startDateTime;
            filteredCoupons = filteredCoupons.stream()
                    .filter(coupon -> coupon.getValidFrom().isAfter(startDateFinal) || 
                                       coupon.getValidFrom().isEqual(startDateFinal))
                    .collect(Collectors.toList());
        }
        
        if (endDateTime != null) {
            final LocalDateTime endDateFinal = endDateTime;
            filteredCoupons = filteredCoupons.stream()
                    .filter(coupon -> coupon.getValidUntil().isBefore(endDateFinal) || 
                                       coupon.getValidUntil().isEqual(endDateFinal))
                    .collect(Collectors.toList());
        }
        
        // Basic statistics
        analytics.put("totalCoupons", filteredCoupons.size());
        
        // Status distribution
        Map<String, Long> statusDistribution = filteredCoupons.stream()
                .collect(Collectors.groupingBy(coupon -> coupon.getStatus().name(), Collectors.counting()));
        analytics.put("statusDistribution", statusDistribution);
        
        // Usage statistics
        int totalUsage = filteredCoupons.stream()
                .mapToInt(coupon -> coupon.getUsageCount() != null ? coupon.getUsageCount() : 0)
                .sum();
        analytics.put("totalUsage", totalUsage);
        
        // Redemption rate (used / total)
        double redemptionRate = 0.0;
        int totalLimit = filteredCoupons.stream()
                .mapToInt(coupon -> coupon.getUsageLimit() != null ? coupon.getUsageLimit() : 0)
                .sum();
        
        if (totalLimit > 0) {
            redemptionRate = (double) totalUsage / totalLimit;
        }
        
        analytics.put("redemptionRate", Math.min(1.0, redemptionRate)); // Cap at 100%
        
        // Most used coupons
        List<Map<String, Object>> mostUsedCoupons = filteredCoupons.stream()
                .sorted(Comparator.comparing(coupon -> coupon.getUsageCount() != null ? coupon.getUsageCount() : 0, Comparator.reverseOrder()))
                .limit(5)
                .map(coupon -> {
                    Map<String, Object> couponData = new HashMap<>();
                    couponData.put("id", coupon.getId());
                    couponData.put("code", coupon.getCode());
                    couponData.put("name", coupon.getName());
                    couponData.put("usageCount", coupon.getUsageCount());
                    couponData.put("usageLimit", coupon.getUsageLimit());
                    return couponData;
                })
                .collect(Collectors.toList());
        analytics.put("mostUsedCoupons", mostUsedCoupons);
        
        // Expiring soon (next 7 days)
        LocalDateTime oneWeekFromNow = LocalDateTime.now().plusDays(7);
        final LocalDateTime now = LocalDateTime.now();
        List<Coupon> expiringSoon = filteredCoupons.stream()
                .filter(coupon -> 
                    coupon.getValidUntil().isBefore(oneWeekFromNow) && 
                    coupon.getValidUntil().isAfter(now) &&
                    coupon.getStatus() == Coupon.CouponStatus.ACTIVE)
                .collect(Collectors.toList());
        analytics.put("expiringSoonCount", expiringSoon.size());
        
        return analytics;
    }
}