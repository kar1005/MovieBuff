package com.moviebuff.moviebuff_backend.model.subscription;
import java.time.LocalDateTime;


import com.moviebuff.moviebuff_backend.model.subscription.Subscription.PaymentMethod;
import com.moviebuff.moviebuff_backend.model.subscription.Subscription.PaymentStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentHistory {
    private String paymentId;
    private double amount;
    private PaymentMethod method;
    private PaymentStatus status;
    private LocalDateTime paymentDate;
    private String transactionDetails;
}


