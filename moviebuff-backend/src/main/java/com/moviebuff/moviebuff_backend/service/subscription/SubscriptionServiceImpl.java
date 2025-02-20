package com.moviebuff.moviebuff_backend.service.subscription;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.moviebuff.moviebuff_backend.dto.response.SubscriptionPlanResponse;
import com.moviebuff.moviebuff_backend.dto.subscription.PaymentInitiateRequest;
import com.moviebuff.moviebuff_backend.dto.subscription.PaymentResponse;
import com.moviebuff.moviebuff_backend.dto.subscription.PaymentVerificationRequest;
import com.moviebuff.moviebuff_backend.dto.subscription.SubscriptionRequest;
import com.moviebuff.moviebuff_backend.dto.subscription.SubscriptionResponse;
import com.moviebuff.moviebuff_backend.model.subscription.PaymentHistory;
import com.moviebuff.moviebuff_backend.model.subscription.Subscription;
import com.moviebuff.moviebuff_backend.model.subscription.Subscription.PaymentMethod;
import com.moviebuff.moviebuff_backend.model.subscription.Subscription.PaymentStatus;
import com.moviebuff.moviebuff_backend.model.subscription.Subscription.SubscriptionStatus;
import com.moviebuff.moviebuff_backend.repository.SubscriptionRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements ISubscriptionService {
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanService planService;
    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    private RazorpayClient razorpayClient;

    @PostConstruct
    public void initializeRazorpay() {
        try {
            this.razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to initialize Razorpay client", e);
        }
    }

    @Override
    public SubscriptionResponse initiateSubscription(SubscriptionRequest request) {
        // Check if active subscription exists
        if (isSubscriptionActive(request.getManagerId())) {
            throw new RuntimeException("Active subscription already exists");
        }

        // Get subscription plan
        SubscriptionPlanResponse plan = planService.getPlanById(request.getPlanId());

        // Create new subscription
        Subscription subscription = new Subscription();
        subscription.setManagerId(request.getManagerId());
        subscription.setPlanId(request.getPlanId());
        subscription.setAmount(plan.getPrice());
        subscription.setStatus(SubscriptionStatus.PENDING);

        return mapToResponse(subscriptionRepository.save(subscription));
    }

    @Override
    public PaymentResponse initiatePayment(PaymentInitiateRequest request) {
        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", request.getAmount() * 100); // Convert to paise
            orderRequest.put("currency", request.getCurrency());

            Order order = razorpayClient.orders.create(orderRequest);

            // Update subscription with order ID
            Subscription subscription = subscriptionRepository.findById(request.getSubscriptionId())
                    .orElseThrow(() -> new RuntimeException("Subscription not found"));
            subscription.setRazorpayOrderId(order.get("id"));

            subscription.setStatus(SubscriptionStatus.ACTIVE);

            LocalDateTime now = LocalDateTime.now();
            subscription.setStartDate(now);

            SubscriptionPlanResponse plan = planService.getPlanById(subscription.getPlanId());
            if (plan.getDuration().equals("MONTHLY")) {
                subscription.setEndDate(now.plusMonths(1));
            } else {
                subscription.setEndDate(now.plusYears(1));
            }

            PaymentHistory payment = new PaymentHistory();
            payment.setPaymentId(order.get("id"));//request.getRazorpayPaymentId()
            payment.setAmount(request.getAmount());
            payment.setMethod(PaymentMethod.RAZORPAY);
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaymentDate(now);

            if (subscription.getPaymentHistory() == null) {
                subscription.setPaymentHistory(new ArrayList<>());
            }
            subscription.getPaymentHistory().add(payment);

            subscriptionRepository.save(subscription);

            return new PaymentResponse(
                    order.get("id"),
                    request.getAmount(),
                    request.getCurrency(),
                    order.get("status"));
        } catch (RazorpayException e) {
            throw new RuntimeException("Error creating payment order", e);
        }
    }

    @Override
    public SubscriptionResponse verifyPayment(PaymentVerificationRequest request) {
        try {
            // // Create signature verification data
            // JSONObject attributes = new JSONObject();
            // attributes.put("razorpay_order_id", request.getRazorpayOrderId());
            // attributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
            // attributes.put("razorpay_signature", request.getRazorpaySignature());

            // Verify signature
            // boolean isValid = Utils.verifyPaymentSignature(attributes,
            // razorpayKeySecret);

            // if (!isValid) {
            // throw new RuntimeException("Invalid payment signature");
            // }

            // Rest of the verification logic remains the same
            Subscription subscription = subscriptionRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                    .orElseThrow(() -> new RuntimeException("Subscription not found"));

            // subscription.setRazorpayPaymentId(request.getRazorpayPaymentId());
            // subscription.setRazorpaySignature(request.getRazorpaySignature());
            subscription.setStatus(SubscriptionStatus.ACTIVE);

            LocalDateTime now = LocalDateTime.now();
            subscription.setStartDate(now);

            SubscriptionPlanResponse plan = planService.getPlanById(subscription.getPlanId());
            if (plan.getDuration().equals("MONTHLY")) {
                subscription.setEndDate(now.plusMonths(1));
            } else {
                subscription.setEndDate(now.plusYears(1));
            }

            PaymentHistory payment = new PaymentHistory();
            payment.setPaymentId(request.getRazorpayPaymentId());
            payment.setAmount(subscription.getAmount());
            payment.setMethod(PaymentMethod.RAZORPAY);
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaymentDate(now);

            if (subscription.getPaymentHistory() == null) {
                subscription.setPaymentHistory(new ArrayList<>());
            }
            subscription.getPaymentHistory().add(payment);

            return mapToResponse(subscriptionRepository.save(subscription));
        } catch (Exception e) {
            throw new RuntimeException("Payment verification failed", e);
        }
    }

    private SubscriptionResponse mapToResponse(Subscription subscription) {
        SubscriptionResponse response = new SubscriptionResponse();
        response.setId(subscription.getId());
        response.setManagerId(subscription.getManagerId());
        response.setPlan(planService.getPlanById(subscription.getPlanId()));
        response.setAmount(subscription.getAmount());
        response.setStartDate(subscription.getStartDate());
        response.setEndDate(subscription.getEndDate());
        response.setStatus(subscription.getStatus());
        response.setPaymentHistory(subscription.getPaymentHistory());
        response.setCreatedAt(subscription.getCreatedAt());
        response.setUpdatedAt(subscription.getUpdatedAt());
        return response;
    }

    @Override
    public void checkAndUpdateExpiredSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> expiredSubscriptions = subscriptionRepository.findExpiredSubscriptions(now);

        for (Subscription subscription : expiredSubscriptions) {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
        }
    }

    @Override
    public SubscriptionResponse getSubscription(String id) {
        return subscriptionRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));
    }

    @Override
    public boolean isSubscriptionActive(String managerId) {
        return subscriptionRepository.existsByManagerIdAndStatusAndEndDateAfter(
                managerId,
                SubscriptionStatus.ACTIVE,
                LocalDateTime.now());
    }

    @Override
    public List<SubscriptionResponse> getManagerSubscriptionHistory(String managerId) {
        return subscriptionRepository.findByManagerIdOrderByCreatedAtDesc(managerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SubscriptionResponse getManagerActiveSubscription(String managerId) {
        return subscriptionRepository.findByManagerIdAndStatus(managerId, SubscriptionStatus.ACTIVE)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("No active subscription found"));
    }
}
