package com.moviebuff.moviebuff_backend.service.subscription;

import org.springframework.stereotype.Component;

import com.moviebuff.moviebuff_backend.dto.subscription.SubscriptionResponse;
import com.moviebuff.moviebuff_backend.model.subscription.Subscription;
import com.moviebuff.moviebuff_backend.model.subscription.SubscriptionPlan;

/**
 * Mapper class for converting between Subscription entity and DTO objects
 */
@Component
public class SubscriptionMapper {

    /**
     * Maps a Subscription entity and its associated SubscriptionPlan to a SubscriptionResponse DTO
     * 
     * @param subscription The subscription entity
     * @param plan The associated subscription plan
     * @return The mapped SubscriptionResponse DTO
     */
    public SubscriptionResponse mapToResponse(Subscription subscription, SubscriptionPlan plan) {
        if (subscription == null) {
            return null;
        }

        SubscriptionResponse response = new SubscriptionResponse();
        response.setId(subscription.getId());
        response.setManagerId(subscription.getManagerId());
        response.setAmount(subscription.getAmount());
        response.setStartDate(subscription.getStartDate());
        response.setEndDate(subscription.getEndDate());
        response.setStatus(subscription.getStatus().name());
        
        // Payment details
        if (subscription.getRazorpayOrderId() != null) {
            response.setRazorpayOrderId(subscription.getRazorpayOrderId());
        }
        
        if (subscription.getRazorpayPaymentId() != null) {
            response.setRazorpayPaymentId(subscription.getRazorpayPaymentId());
        }
        
        // Add payment history if available
        if (subscription.getPaymentHistory() != null) {
            response.setPaymentHistory(subscription.getPaymentHistory());
        }
        
        // Add creation and update timestamps
        response.setCreatedAt(subscription.getCreatedAt());
        response.setUpdatedAt(subscription.getUpdatedAt());
        
        // Add plan details if available
        if (plan != null) {
            response.setPlan(mapPlanToResponsePlan(plan));
        }
        
        return response;
    }
    
    /**
     * Maps a SubscriptionPlan entity to a PlanDetails object within SubscriptionResponse
     * 
     * @param plan The subscription plan entity
     * @return The mapped PlanDetails object
     */
    private SubscriptionResponse.PlanDetails mapPlanToResponsePlan(SubscriptionPlan plan) {
        SubscriptionResponse.PlanDetails planDetails = new SubscriptionResponse.PlanDetails();
        planDetails.setId(plan.getId());
        planDetails.setName(plan.getName());
        planDetails.setDescription(plan.getDescription());
        planDetails.setPrice(plan.getPrice());
        planDetails.setDuration(plan.getDuration());
        planDetails.setFeatures(plan.getFeatures());
        planDetails.setIsActive(plan.getIsActive());
        return planDetails;
    }
}