package com.moviebuff.moviebuff_backend.service.subscription;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.Comparator;
import com.moviebuff.moviebuff_backend.dto.response.SubscriptionPlanResponse;
import com.moviebuff.moviebuff_backend.dto.subscription.PaymentInitiateRequest;
import com.moviebuff.moviebuff_backend.dto.subscription.PaymentResponse;
import com.moviebuff.moviebuff_backend.dto.subscription.PaymentVerificationRequest;
import com.moviebuff.moviebuff_backend.dto.subscription.SubscriptionRequest;
import com.moviebuff.moviebuff_backend.dto.subscription.SubscriptionResponse;
import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import com.moviebuff.moviebuff_backend.model.subscription.PaymentHistory;
import com.moviebuff.moviebuff_backend.model.subscription.Subscription;
import com.moviebuff.moviebuff_backend.model.subscription.Subscription.PaymentMethod;
import com.moviebuff.moviebuff_backend.model.subscription.Subscription.PaymentStatus;
import com.moviebuff.moviebuff_backend.model.subscription.Subscription.SubscriptionStatus;
import com.moviebuff.moviebuff_backend.model.subscription.SubscriptionPlan;
import com.moviebuff.moviebuff_backend.repository.interfaces.subscription.SubscriptionPlanRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.subscription.SubscriptionRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionServiceImpl implements ISubscriptionService {
    @Autowired
    private SubscriptionRepository subscriptionRepository;
    @Autowired
    private ISubscriptionPlanService planService;
    @Autowired
    private SubscriptionPlanRepository subscriptionPlanRepository;
    @Autowired
    private SubscriptionMapper subscriptionMapper;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    private RazorpayClient razorpayClient;

    @PostConstruct
    public void initializeRazorpay() {
        try {
            this.razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            log.info("Razorpay client initialized successfully with key ID: {}", razorpayKeyId);
        } catch (RazorpayException e) {
            log.error("Failed to initialize Razorpay client", e);
            throw new RuntimeException("Failed to initialize Razorpay client", e);
        }
    }

    @Override
    public SubscriptionResponse initiateSubscription(SubscriptionRequest request) {
        log.info("Initiating subscription for manager: {}, plan: {}", request.getManagerId(), request.getPlanId());
        
        // Check if active subscription exists
        if (isSubscriptionActive(request.getManagerId())) {
            log.warn("Active subscription already exists for manager: {}", request.getManagerId());
            throw new RuntimeException("Active subscription already exists");
        }

        // Get subscription plan
        SubscriptionPlanResponse plan = planService.getPlanById(request.getPlanId());
        log.info("Found subscription plan: {}, price: {}", plan.getName(), plan.getPrice());

        // Create new subscription
        Subscription subscription = new Subscription();
        subscription.setManagerId(request.getManagerId());
        subscription.setPlanId(request.getPlanId());
        subscription.setAmount(plan.getPrice());
        subscription.setStatus(SubscriptionStatus.PENDING);

        Subscription savedSubscription = subscriptionRepository.save(subscription);
        log.info("Subscription initiated with ID: {}", savedSubscription.getId());
        
        return mapToResponse(savedSubscription);
    }

    @Override
    public PaymentResponse initiatePayment(PaymentInitiateRequest request) {
        log.info("Initiating payment for subscription: {}, amount: {}", request.getSubscriptionId(), request.getAmount());
        
        try {
            // Find the subscription first
            Subscription subscription = subscriptionRepository.findById(request.getSubscriptionId())
                    .orElseThrow(() -> new RuntimeException("Subscription not found with ID: " + request.getSubscriptionId()));
            
            // Create a Razorpay order
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", Math.round(request.getAmount() * 100)); // Convert to paise, ensure integer value
            orderRequest.put("currency", request.getCurrency());
            orderRequest.put("receipt", "rcpt_" + subscription.getId());
            orderRequest.put("payment_capture", 1); // Auto capture payment
            
            log.debug("Creating Razorpay order with request: {}", orderRequest);
            Order order = razorpayClient.orders.create(orderRequest);
            log.info("Razorpay order created with ID: " + order.get("id"));            
            // Update subscription with order ID
            subscription.setRazorpayOrderId(order.get("id"));
            
            // Create a payment history entry for the order
            PaymentHistory paymentHistory = new PaymentHistory();
            paymentHistory.setPaymentId(order.get("id"));
            paymentHistory.setAmount(request.getAmount());
            paymentHistory.setMethod(PaymentMethod.RAZORPAY);
            paymentHistory.setStatus(PaymentStatus.PENDING);
            paymentHistory.setPaymentDate(LocalDateTime.now());
            paymentHistory.setTransactionDetails("Order created");
            
            // Initialize payment history list if not present
            if (subscription.getPaymentHistory() == null) {
                subscription.setPaymentHistory(new ArrayList<>());
            }
            subscription.getPaymentHistory().add(paymentHistory);
            
            // Save the updated subscription
            subscriptionRepository.save(subscription);
            
            // Return payment response with order details
            return new PaymentResponse(
                    order.get("id"),
                    request.getAmount(),
                    request.getCurrency(),
                    order.get("status"));
                    
        } catch (RazorpayException e) {
            log.error("Error creating Razorpay payment order", e);
            throw new RuntimeException("Error creating payment order: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error during payment initiation", e);
            throw new RuntimeException("Payment initiation failed: " + e.getMessage(), e);
        }
    }

    @Override
    public SubscriptionResponse verifyPayment(PaymentVerificationRequest request) {
        log.info("Verifying payment for order: {}", request.getRazorpayOrderId());
        
        try {
            // Verify payment signature
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", request.getRazorpayOrderId());
            attributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
            attributes.put("razorpay_signature", request.getRazorpaySignature());
            
            // Verify the payment signature
            boolean isValid = Utils.verifyPaymentSignature(attributes, razorpayKeySecret);
            
            if (!isValid) {
                log.error("Invalid payment signature for order: {}", request.getRazorpayOrderId());
                throw new RuntimeException("Invalid payment signature");
            }
            
            log.info("Payment signature verified successfully for order: {}", request.getRazorpayOrderId());
            
            // Find subscription by Razorpay order ID
            Subscription subscription = subscriptionRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                    .orElseThrow(() -> new RuntimeException("Subscription not found for order: " + request.getRazorpayOrderId()));
            
            // Update subscription with payment details
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            
            // Set dates if not already set
            LocalDateTime now = LocalDateTime.now();
            if (subscription.getStartDate() == null) {
                subscription.setStartDate(now);
            }
            
            // Determine end date based on plan duration
            if (subscription.getEndDate() == null) {
                SubscriptionPlanResponse plan = planService.getPlanById(subscription.getPlanId());
                if ("MONTHLY".equals(plan.getDuration())) {
                    subscription.setEndDate(now.plusMonths(1));
                } else {
                    subscription.setEndDate(now.plusYears(1));
                }
                log.info("Set subscription end date to: {}", subscription.getEndDate());
            }
            
            // Add payment history entry for successful payment
            PaymentHistory payment = new PaymentHistory();
            payment.setPaymentId(request.getRazorpayPaymentId());
            payment.setAmount(subscription.getAmount());
            payment.setMethod(PaymentMethod.RAZORPAY);
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaymentDate(now);
            payment.setTransactionDetails("Payment verified with signature");
            
            if (subscription.getPaymentHistory() == null) {
                subscription.setPaymentHistory(new ArrayList<>());
            }
            subscription.getPaymentHistory().add(payment);
            
            // Save the updated subscription
            Subscription savedSubscription = subscriptionRepository.save(subscription);
            log.info("Subscription activated successfully: {}", savedSubscription.getId());
            
            return mapToResponse(savedSubscription);
            
        } catch (Exception e) {
            log.error("Payment verification failed", e);
            throw new RuntimeException("Payment verification failed: " + e.getMessage(), e);
        }
    }

    private SubscriptionResponse mapToResponse(Subscription subscription) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(subscription.getPlanId())
            .orElse(null); // Get plan but allow it to be null
        return subscriptionMapper.mapToResponse(subscription, plan);
    }

@Override
@Scheduled(cron = "0 0 0 * * ?") // Run daily at midnight
public void checkAndUpdateExpiredSubscriptions() {
    log.info("Running scheduled task to check and update expired subscriptions");
    LocalDateTime now = LocalDateTime.now();
    
    // Find all active subscriptions that have ended
    List<Subscription> expiredSubscriptions = subscriptionRepository.findByStatusAndEndDateBefore(
        Subscription.SubscriptionStatus.ACTIVE, 
        now
    );
    
    log.info("Found {} expired subscriptions", expiredSubscriptions.size());
    
    for (Subscription subscription : expiredSubscriptions) {
        subscription.setStatus(Subscription.SubscriptionStatus.EXPIRED);
        subscriptionRepository.save(subscription);
        log.info("Updated subscription ID: {} to EXPIRED status", subscription.getId());
    }
}

private void checkAndUpdateManagerExpiredSubscriptions(String managerId) {
    LocalDateTime now = LocalDateTime.now();
    
    // Find all active subscriptions for this manager that have ended
    List<Subscription> expiredSubscriptions = subscriptionRepository.findByManagerIdAndStatusAndEndDateBefore(
        managerId,
        Subscription.SubscriptionStatus.ACTIVE, 
        now
    );
    
    for (Subscription subscription : expiredSubscriptions) {
        subscription.setStatus(Subscription.SubscriptionStatus.EXPIRED);
        subscriptionRepository.save(subscription);
        log.info("Updated subscription ID: {} to EXPIRED status for manager: {}", 
            subscription.getId(), managerId);
    }
}

    @Override
    public SubscriptionResponse getSubscription(String id) {
        return subscriptionRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Subscription not found with ID: " + id));
    }

    @Override
    public boolean isSubscriptionActive(String managerId) {
        checkAndUpdateManagerExpiredSubscriptions(managerId);
        boolean isActive = subscriptionRepository.existsByManagerIdAndStatusAndEndDateAfter(
                managerId,
                SubscriptionStatus.ACTIVE,
                LocalDateTime.now());
        log.debug("Subscription active check for manager {}: {}", managerId, isActive);
        return isActive;
    }

    @Override
    public List<SubscriptionResponse> getManagerSubscriptionHistory(String managerId) {
        List<Subscription> subscriptions = subscriptionRepository.findByManagerIdOrderByCreatedAtDesc(managerId);
        log.info("Found {} subscription history records for manager {}", subscriptions.size(), managerId);
        
        return subscriptions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
public SubscriptionResponse getManagerActiveSubscription(String managerId) {
    // First check and update any expired subscriptions
    checkAndUpdateManagerExpiredSubscriptions(managerId);
    
    // Get all active subscriptions for this manager
    Optional<Subscription> activeSubscriptions = subscriptionRepository.findByManagerIdAndStatus(
        managerId, Subscription.SubscriptionStatus.ACTIVE);
    
    if (activeSubscriptions.isEmpty()) {
        throw new ResourceNotFoundException("No active subscription found for manager ID: " + managerId);
    }
    
    // If multiple active subscriptions exist, return the most recent one based on start date
    Subscription latestSubscription = activeSubscriptions.stream()
        .sorted(Comparator.comparing(Subscription::getStartDate).reversed())
        .findFirst()
        .orElseThrow(() -> new ResourceNotFoundException("No active subscription found for manager ID: " + managerId));
    
    // Fetch plan details for the response
    SubscriptionPlan plan = subscriptionPlanRepository.findById(latestSubscription.getPlanId())
        .orElseThrow(() -> new ResourceNotFoundException("Subscription plan not found"));
    
    // Map to response object and return
    return subscriptionMapper.mapToResponse(latestSubscription, plan);
}
}