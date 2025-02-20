package com.moviebuff.moviebuff_backend.model.subscription;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Data
@Document(collection = "subscription_plans")
public class SubscriptionPlan {
    @Id
    private String id;
    private String name;
    private String description;
    private Double price;
    private String duration; // MONTHLY, YEARLY
    private List<String> features;
    private Boolean isActive;
}
