package com.moviebuff.moviebuff_backend.service.coupon;

import com.moviebuff.moviebuff_backend.model.coupon.Coupon;
import java.util.List;
import java.util.Map;

public interface ICouponService {
    
    // CRUD operations
    List<Coupon> getAllCoupons(Coupon.CouponStatus status, String campaignId);
    Coupon getCouponById(String id);
    Coupon getCouponByCode(String code);
    Coupon createCoupon(Coupon coupon);
    Coupon updateCoupon(String id, Coupon coupon);
    void deleteCoupon(String id);
    
    // Status operations
    Coupon updateCouponStatus(String id, Coupon.CouponStatus status, String reason);
    
    // Validation operations
    Map<String, Object> validateCoupon(String code, String userId, String movieId, 
                                       String theaterId, String experience, String city, 
                                       Double bookingAmount);
    
    // User-specific operations
    List<Coupon> getUserApplicableCoupons(String userId, String movieId, 
                                         String theaterId, Double bookingAmount);
    
    // Analytics operations
    Map<String, Object> getCouponAnalytics(String campaignId, String startDate, String endDate);
}