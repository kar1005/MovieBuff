package com.moviebuff.moviebuff_backend.controller.coupon;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.moviebuff.moviebuff_backend.model.coupon.Coupon;
import com.moviebuff.moviebuff_backend.repository.interfaces.coupon.ICouponRepository;

@RestController
@RequestMapping("/api/coupon")
public class CouponController {
    @Autowired
    private ICouponRepository couponRepository;

    @GetMapping
    public ResponseEntity<List<Coupon>> getAllCoupon(){
        List<Coupon> bookings = couponRepository.findAll();
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Coupon> getCouponById(@PathVariable String id){
        return couponRepository.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Coupon> createCoupon(@RequestBody Coupon coupon){
        Coupon saved = couponRepository.save(coupon);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Coupon> updateCoupon(@PathVariable String id, @RequestBody Coupon coupon){
        if(!couponRepository.existsById(id)){
            return ResponseEntity.notFound().build();
        }
        coupon.setId(id);
        Coupon updated = couponRepository.save(coupon);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable String id){
        couponRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
