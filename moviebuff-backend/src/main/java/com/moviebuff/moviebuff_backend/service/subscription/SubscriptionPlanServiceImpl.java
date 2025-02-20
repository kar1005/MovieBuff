package com.moviebuff.moviebuff_backend.service.subscription;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.moviebuff.moviebuff_backend.dto.request.SubscriptionPlanRequest;
import com.moviebuff.moviebuff_backend.dto.response.SubscriptionPlanResponse;
import com.moviebuff.moviebuff_backend.model.subscription.SubscriptionPlan;
import com.moviebuff.moviebuff_backend.repository.SubscriptionPlanRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubscriptionPlanServiceImpl implements SubscriptionPlanService {
    private final SubscriptionPlanRepository planRepository;
    
    @Override
    public SubscriptionPlanResponse createPlan(SubscriptionPlanRequest request) {
        SubscriptionPlan plan = new SubscriptionPlan();
        mapRequestToPlan(request, plan);
        SubscriptionPlan savedPlan = planRepository.save(plan);
        return mapPlanToResponse(savedPlan);
    }
    
    @Override
    public SubscriptionPlanResponse updatePlan(String id, SubscriptionPlanRequest request) {
        SubscriptionPlan existingPlan = planRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Plan not found with id: " + id));
            
        mapRequestToPlan(request, existingPlan);
        SubscriptionPlan updatedPlan = planRepository.save(existingPlan);
        return mapPlanToResponse(updatedPlan);
    }
    
    @Override
    public void deletePlan(String id) {
        planRepository.deleteById(id);
    }
    
    @Override
    public SubscriptionPlanResponse getPlanById(String id) {
        SubscriptionPlan plan = planRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Plan not found with id: " + id));
        return mapPlanToResponse(plan);
    }
    
    @Override
    public List<SubscriptionPlanResponse> getAllPlans() {
        return planRepository.findAll().stream()
                .map(this::mapPlanToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<SubscriptionPlanResponse> getActivePlans() {
        return planRepository.findByIsActiveTrue().stream()
                .map(this::mapPlanToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public SubscriptionPlanResponse togglePlanStatus(String id) {
        SubscriptionPlan plan = planRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Plan not found with id: " + id));
        plan.setIsActive(!plan.getIsActive());
        return mapPlanToResponse(planRepository.save(plan));
    }
    
    @Override
    public List<SubscriptionPlanResponse> getPlansByDuration(String duration) {
        return planRepository.findByDuration(duration).stream()
                .map(this::mapPlanToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public SubscriptionPlanResponse getPlanByName(String name) {
        return planRepository.findByNameAndIsActiveTrue(name)
                .map(this::mapPlanToResponse)
                .orElseThrow(() -> new RuntimeException("Plan not found with name: " + name));
    }
    
    private void mapRequestToPlan(SubscriptionPlanRequest request, SubscriptionPlan plan) {
        plan.setName(request.getName());
        plan.setDescription(request.getDescription());
        plan.setPrice(request.getPrice());
        plan.setDuration(request.getDuration());
        plan.setFeatures(request.getFeatures());
        plan.setIsActive(request.getIsActive());
    }
    
    private SubscriptionPlanResponse mapPlanToResponse(SubscriptionPlan plan) {
        SubscriptionPlanResponse response = new SubscriptionPlanResponse();
        response.setId(plan.getId());
        response.setName(plan.getName());
        response.setDescription(plan.getDescription());
        response.setPrice(plan.getPrice());
        response.setDuration(plan.getDuration());
        response.setFeatures(plan.getFeatures());
        response.setIsActive(plan.getIsActive());
        return response;
    }
}
