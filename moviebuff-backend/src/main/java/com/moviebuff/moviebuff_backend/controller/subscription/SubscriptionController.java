package com.moviebuff.moviebuff_backend.controller.subscription;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.moviebuff.moviebuff_backend.dto.subscription.PaymentInitiateRequest;
import com.moviebuff.moviebuff_backend.dto.subscription.PaymentResponse;
import com.moviebuff.moviebuff_backend.dto.subscription.PaymentVerificationRequest;
import com.moviebuff.moviebuff_backend.dto.subscription.SubscriptionRequest;
import com.moviebuff.moviebuff_backend.dto.subscription.SubscriptionResponse;
import com.moviebuff.moviebuff_backend.service.subscription.ISubscriptionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {
    private final ISubscriptionService subscriptionService;
    
    @PostMapping
    public ResponseEntity<SubscriptionResponse> initiateSubscription(
            @Valid @RequestBody SubscriptionRequest request) {
        return ResponseEntity.ok(subscriptionService.initiateSubscription(request));
    }
    
    @PostMapping("/payment/initiate")
    public ResponseEntity<PaymentResponse> initiatePayment(
            @Valid @RequestBody PaymentInitiateRequest request) {
        return ResponseEntity.ok(subscriptionService.initiatePayment(request));
    }
    
    @PostMapping("/payment/verify")
    public ResponseEntity<SubscriptionResponse> verifyPayment(
            @Valid @RequestBody PaymentVerificationRequest request) {
        return ResponseEntity.ok(subscriptionService.verifyPayment(request));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SubscriptionResponse> getSubscription(@PathVariable String id) {
        return ResponseEntity.ok(subscriptionService.getSubscription(id));
    }
    
    @GetMapping("/manager/active")
    public ResponseEntity<SubscriptionResponse> getActiveSubscription(
            @RequestParam String managerId) {
        return ResponseEntity.ok(subscriptionService.getManagerActiveSubscription(managerId));
    }
    
    @GetMapping("/manager/history")
    public ResponseEntity<List<SubscriptionResponse>> getSubscriptionHistory(
            @RequestParam String managerId) {
        return ResponseEntity.ok(subscriptionService.getManagerSubscriptionHistory(managerId));
    }
    
    @GetMapping("/manager/status")
    public ResponseEntity<Boolean> checkSubscriptionStatus(@RequestParam String managerId) {
        return ResponseEntity.ok(subscriptionService.isSubscriptionActive(managerId));
    }
}
