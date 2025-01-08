package com.moviebuff.moviebuff_backend.repository.interfaces.coupon;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.moviebuff.moviebuff_backend.model.coupon.Coupon;

@Repository
public interface ICouponRepository extends MongoRepository<Coupon, String>{
    
}
