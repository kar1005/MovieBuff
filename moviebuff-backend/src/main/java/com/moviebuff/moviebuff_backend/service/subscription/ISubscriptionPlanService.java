package com.moviebuff.moviebuff_backend.service.subscription;

import java.util.List;

import com.moviebuff.moviebuff_backend.dto.request.SubscriptionPlanRequest;
import com.moviebuff.moviebuff_backend.dto.response.SubscriptionPlanResponse;

public interface ISubscriptionPlanService {
    // CRUD Operations
    SubscriptionPlanResponse createPlan(SubscriptionPlanRequest request);
    SubscriptionPlanResponse updatePlan(String id, SubscriptionPlanRequest request);
    void deletePlan(String id);
    SubscriptionPlanResponse getPlanById(String id);
    List<SubscriptionPlanResponse> getAllPlans();
    
    // Specific Operations
    List<SubscriptionPlanResponse> getActivePlans();
    SubscriptionPlanResponse togglePlanStatus(String id);
    List<SubscriptionPlanResponse> getPlansByDuration(String duration);
    SubscriptionPlanResponse getPlanByName(String name);
}
