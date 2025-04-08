package com.moviebuff.moviebuff_backend.repository.interfaces.subscription;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.moviebuff.moviebuff_backend.model.subscription.Subscription;
import com.moviebuff.moviebuff_backend.model.subscription.Subscription.SubscriptionStatus;

@Repository
public interface SubscriptionRepository extends MongoRepository<Subscription, String> {
    Optional<Subscription> findByManagerIdAndStatus(String managerId, SubscriptionStatus status);
    
    List<Subscription> findByEndDateBeforeAndStatus(LocalDateTime date, SubscriptionStatus status);
    
    Optional<Subscription> findByRazorpayOrderId(String orderId);
    
    List<Subscription> findByManagerIdOrderByCreatedAtDesc(String managerId);
    
    boolean existsByManagerIdAndStatusAndEndDateAfter(String managerId, SubscriptionStatus status, LocalDateTime date);
    
    List<Subscription> findByStatusAndEndDateBefore(SubscriptionStatus status, LocalDateTime date);

    @Query("{'endDate': {'$lt': ?0}, 'status': 'ACTIVE'}")
    List<Subscription> findExpiredSubscriptions(LocalDateTime currentDate);

    List<Subscription> findByManagerIdAndStatusAndEndDateBefore(String managerId, Subscription.SubscriptionStatus status, LocalDateTime date);
}