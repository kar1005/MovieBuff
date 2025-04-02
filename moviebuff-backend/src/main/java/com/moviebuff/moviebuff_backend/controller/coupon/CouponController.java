package com.moviebuff.moviebuff_backend.controller.coupon;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.moviebuff.moviebuff_backend.model.coupon.Coupon;
import com.moviebuff.moviebuff_backend.service.coupon.ICouponService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/coupons")
@CrossOrigin(origins = "*")
public class CouponController {
    @Autowired
    private ICouponService couponService;

    @GetMapping
    public ResponseEntity<List<Coupon>> getAllCoupons(
            @RequestParam(required = false) Coupon.CouponStatus status,
            @RequestParam(required = false) String campaignId) {
        return ResponseEntity.ok(couponService.getAllCoupons(status, campaignId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Coupon> getCouponById(@PathVariable String id) {
        return ResponseEntity.ok(couponService.getCouponById(id));
    }
    
    @GetMapping("/code/{code}")
    public ResponseEntity<Coupon> getCouponByCode(@PathVariable String code) {
        return ResponseEntity.ok(couponService.getCouponByCode(code));
    }

    @PostMapping
    public ResponseEntity<Coupon> createCoupon(@Valid @RequestBody Coupon coupon) {
        return ResponseEntity.ok(couponService.createCoupon(coupon));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Coupon> updateCoupon(
            @PathVariable String id, 
            @Valid @RequestBody Coupon coupon) {
        return ResponseEntity.ok(couponService.updateCoupon(id, coupon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable String id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/status")
    public ResponseEntity<Coupon> updateCouponStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusData) {
        Coupon.CouponStatus status = Coupon.CouponStatus.valueOf(statusData.get("status"));
        String reason = statusData.get("reason");
        return ResponseEntity.ok(couponService.updateCouponStatus(id, status, reason));
    }
    
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateCoupon(
            @RequestParam String code,
            @RequestParam String userId,
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) String theaterId,
            @RequestParam(required = false) String experience,
            @RequestParam(required = false) String city,
            @RequestParam Double bookingAmount) {
        return ResponseEntity.ok(couponService.validateCoupon(code, userId, movieId, theaterId, 
                experience, city, bookingAmount));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Coupon>> getUserApplicableCoupons(
            @PathVariable String userId,
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) String theaterId,
            @RequestParam(required = false) Double bookingAmount) {
        return ResponseEntity.ok(couponService.getUserApplicableCoupons(userId, movieId, theaterId, bookingAmount));
    }
    
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getCouponAnalytics(
            @RequestParam(required = false) String campaignId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(couponService.getCouponAnalytics(campaignId, startDate, endDate));
    }
}