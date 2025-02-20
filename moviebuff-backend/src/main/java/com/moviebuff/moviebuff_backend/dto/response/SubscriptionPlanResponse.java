package com.moviebuff.moviebuff_backend.dto.response;
import java.util.List;

import lombok.Data;

@Data
public class SubscriptionPlanResponse {
    private String id;
    private String name;
    private String description;
    private Double price;
    private String duration;
    private List<String> features;
    private Boolean isActive;
}
