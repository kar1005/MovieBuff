package com.moviebuff.moviebuff_backend.service.subscription;

import java.util.List;

import com.moviebuff.moviebuff_backend.dto.subscription.PaymentInitiateRequest;
import com.moviebuff.moviebuff_backend.dto.subscription.PaymentResponse;
import com.moviebuff.moviebuff_backend.dto.subscription.PaymentVerificationRequest;
import com.moviebuff.moviebuff_backend.dto.subscription.SubscriptionRequest;
import com.moviebuff.moviebuff_backend.dto.subscription.SubscriptionResponse;

public interface ISubscriptionService {
    SubscriptionResponse initiateSubscription(SubscriptionRequest request);
    SubscriptionResponse getSubscription(String subscriptionId);
    SubscriptionResponse getManagerActiveSubscription(String managerId);
    List<SubscriptionResponse> getManagerSubscriptionHistory(String managerId);
    
    PaymentResponse initiatePayment(PaymentInitiateRequest request);
    SubscriptionResponse verifyPayment(PaymentVerificationRequest request);
    
    boolean isSubscriptionActive(String managerId);
    void checkAndUpdateExpiredSubscriptions();
}
