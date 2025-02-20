package com.moviebuff.moviebuff_backend.dto.subscription;
import java.time.LocalDateTime;
import java.util.List;

import com.moviebuff.moviebuff_backend.dto.response.SubscriptionPlanResponse;
import com.moviebuff.moviebuff_backend.model.subscription.PaymentHistory;
import com.moviebuff.moviebuff_backend.model.subscription.Subscription.SubscriptionStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
    private String id;
    private String managerId;
    private SubscriptionPlanResponse plan;
    private double amount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private SubscriptionStatus status;
    private List<PaymentHistory> paymentHistory;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}