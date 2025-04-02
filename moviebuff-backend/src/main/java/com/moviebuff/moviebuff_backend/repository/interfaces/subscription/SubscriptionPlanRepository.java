package com.moviebuff.moviebuff_backend.repository.interfaces.subscription;

import com.moviebuff.moviebuff_backend.model.subscription.SubscriptionPlan;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionPlanRepository extends MongoRepository<SubscriptionPlan, String> {
    List<SubscriptionPlan> findByIsActiveTrue();
    Optional<SubscriptionPlan> findByNameAndIsActiveTrue(String name);
    List<SubscriptionPlan> findByDuration(String duration);
    boolean existsByNameAndIdNot(String name, String id);
}