package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.Subscription;
import com.carenet.carenet_backend.repo.SubscriptionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@RestController
@RequestMapping("/subscribe")
@RequiredArgsConstructor
public class SubscriptionController {
    
    private final SubscriptionRepo subscriptionRepo;

    @PostMapping
    public Map<String, Object> subscribe(
            @RequestHeader(name="X-User-Id", required=false) Long userId,
            @RequestBody Map<String, String> request) {
        
        try {
            Long uid = (userId != null) ? userId : 1L;
            String tier = request.getOrDefault("tier", "PREMIUM").toUpperCase();
            
            System.out.println("Subscribe request - User ID: " + uid + ", Tier: " + tier);
            
            // Check if user already has an active subscription
            var existing = subscriptionRepo.findByUserIdAndActive(uid, true);
            if (existing.isPresent()) {
                System.out.println("User already has active subscription");
                return Map.of(
                    "success", false,
                    "message", "User already has an active subscription",
                    "existingSubscription", existing.get()
                );
            }
            
            // Create new subscription
            Subscription subscription = new Subscription();
            subscription.setUserId(uid);
            subscription.setTier(tier);
            subscription.setStartDate(Instant.now());
            subscription.setEndDate(Instant.now().plus(365, ChronoUnit.DAYS)); // 1 year
            subscription.setActive(true);
            subscription.setCreatedAt(Instant.now());
            
            Subscription saved = subscriptionRepo.save(subscription);
            System.out.println("Subscription created successfully: ID=" + saved.getId());
            
            return Map.of(
                "success", true,
                "message", "Successfully subscribed to " + tier + " plan",
                "subscription", saved
            );
        } catch (Exception e) {
            System.err.println("Error in subscribe endpoint: " + e.getMessage());
            e.printStackTrace();
            return Map.of(
                "success", false,
                "message", "Error creating subscription: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            );
        }
    }

    @PostMapping("/activate")
    public Map<String, Object> activateSubscription(
            @RequestHeader(name="X-User-Id", required=false) Long userId,
            @RequestBody Map<String, String> request) {
        
        Long uid = (userId != null) ? userId : 1L;
        String tier = request.getOrDefault("tier", "PREMIUM");
        
        // Deactivate existing subscriptions
        subscriptionRepo.findByUserId(uid).forEach(sub -> {
            sub.setActive(false);
            subscriptionRepo.save(sub);
        });
        
        // Create new subscription
        Subscription subscription = new Subscription();
        subscription.setUserId(uid);
        subscription.setTier(tier);
        subscription.setStartDate(Instant.now());
        subscription.setEndDate(Instant.now().plus(365, ChronoUnit.DAYS));
        subscription.setActive(true);
        subscription.setCreatedAt(Instant.now());
        
        subscriptionRepo.save(subscription);
        
        return Map.of(
            "success", true,
            "message", "Subscription activated successfully",
            "subscription", subscription
        );
    }

    @GetMapping("/status")
    public Map<String, Object> getSubscriptionStatus(
            @RequestHeader(name="X-User-Id", required=false) Long userId) {

        Long uid = (userId != null) ? userId : 1L;
        var subscription = subscriptionRepo.findByUserIdAndActive(uid, true);

        if (subscription.isPresent()) {
            Subscription sub = subscription.get();
            return Map.of(
                "isSubscribed", true,
                "tier", sub.getTier(),
                "startDate", sub.getStartDate(),
                "endDate", sub.getEndDate()
            );
        }

        return Map.of(
            "isSubscribed", false,
            "tier", "FREE"
        );
    }

    @PostMapping("/cancel")
    public Map<String, Object> cancelSubscription(
            @RequestHeader(name="X-User-Id", required=false) Long userId) {
        
        try {
            Long uid = (userId != null) ? userId : 1L;
            System.out.println("Cancel subscription request - User ID: " + uid);
            
            // Find active subscription
            var existingSubscription = subscriptionRepo.findByUserIdAndActive(uid, true);
            
            if (existingSubscription.isEmpty()) {
                return Map.of(
                    "success", false,
                    "message", "No active subscription found to cancel"
                );
            }
            
            // Deactivate the subscription
            Subscription subscription = existingSubscription.get();
            subscription.setActive(false);
            subscription.setEndDate(Instant.now()); // End immediately
            subscriptionRepo.save(subscription);
            
            System.out.println("Subscription cancelled successfully for user: " + uid);
            
            return Map.of(
                "success", true,
                "message", "Subscription cancelled successfully",
                "cancelledSubscription", subscription
            );
            
        } catch (Exception e) {
            System.err.println("Error cancelling subscription: " + e.getMessage());
            e.printStackTrace();
            return Map.of(
                "success", false,
                "message", "Error cancelling subscription: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            );
        }
    }
}
