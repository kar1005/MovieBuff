package com.moviebuff.moviebuff_backend.controller.subscription;

import com.moviebuff.moviebuff_backend.dto.request.SubscriptionPlanRequest;
import com.moviebuff.moviebuff_backend.dto.response.SubscriptionPlanResponse;
import com.moviebuff.moviebuff_backend.service.subscription.ISubscriptionPlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/subscription-plans")
@RequiredArgsConstructor
public class SubscriptionPlanController {
    private final ISubscriptionPlanService planService;
    
    @PostMapping
    public ResponseEntity<SubscriptionPlanResponse> createPlan(@Valid @RequestBody SubscriptionPlanRequest request) {
        return ResponseEntity.ok(planService.createPlan(request));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SubscriptionPlanResponse> updatePlan(
            @PathVariable String id,
            @Valid @RequestBody SubscriptionPlanRequest request) {
        return ResponseEntity.ok(planService.updatePlan(id, request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable String id) {
        planService.deletePlan(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SubscriptionPlanResponse> getPlan(@PathVariable String id) {
        return ResponseEntity.ok(planService.getPlanById(id));
    }
    
    @GetMapping
    public ResponseEntity<List<SubscriptionPlanResponse>> getAllPlans(
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(required = false) String duration) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return ResponseEntity.ok(planService.getActivePlans());
        } else if (duration != null) {
            return ResponseEntity.ok(planService.getPlansByDuration(duration));
        }
        return ResponseEntity.ok(planService.getAllPlans());
    }
    
    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<SubscriptionPlanResponse> togglePlanStatus(@PathVariable String id) {
        return ResponseEntity.ok(planService.togglePlanStatus(id));
    }
    
    @GetMapping("/by-name/{name}")
    public ResponseEntity<SubscriptionPlanResponse> getPlanByName(@PathVariable String name) {
        return ResponseEntity.ok(planService.getPlanByName(name));
    }
}
