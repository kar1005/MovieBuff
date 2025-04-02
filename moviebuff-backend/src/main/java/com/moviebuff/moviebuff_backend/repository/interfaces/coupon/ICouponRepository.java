package com.moviebuff.moviebuff_backend.repository.interfaces.coupon;

import com.moviebuff.moviebuff_backend.model.coupon.Coupon;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ICouponRepository extends MongoRepository<Coupon, String> {

    Optional<Coupon> findByCode(String code);
    
    boolean existsByCode(String code);
    
    List<Coupon> findByStatus(Coupon.CouponStatus status);
    
    List<Coupon> findByCampaignId(String campaignId);
    
    List<Coupon> findByStatusAndCampaignId(Coupon.CouponStatus status, String campaignId);
    
    @Query("{'validFrom': {$lte: ?0}, 'validUntil': {$gte: ?0}, 'status': ?1}")
    List<Coupon> findActiveCouponsAtTime(LocalDateTime dateTime, Coupon.CouponStatus status);
    
    @Query("{'targetUserIds': ?0, 'status': ?1}")
    List<Coupon> findByTargetUserIdAndStatus(String userId, Coupon.CouponStatus status);
    
    @Query("{'targetMovieIds': ?0, 'status': ?1}")
    List<Coupon> findByTargetMovieIdAndStatus(String movieId, Coupon.CouponStatus status);
    
    @Query("{'targetTheaterIds': ?0, 'status': ?1}")
    List<Coupon> findByTargetTheaterIdAndStatus(String theaterId, Coupon.CouponStatus status);
    
    @Query("{'targetCities': ?0, 'status': ?1}")
    List<Coupon> findByTargetCityAndStatus(String city, Coupon.CouponStatus status);
    
    @Query("{'userTargetType': ?0, 'status': ?1}")
    List<Coupon> findByUserTargetTypeAndStatus(Coupon.UserTargetType targetType, Coupon.CouponStatus status);
    
    @Query("{'validUntil': {$lt: ?0}, 'status': ?1}")
    List<Coupon> findExpiredCoupons(LocalDateTime now, Coupon.CouponStatus status);
    
    @Query("{'usageCount': {$gte: 'usageLimit'}, 'status': ?0}")
    List<Coupon> findDepletedCoupons(Coupon.CouponStatus status);
}