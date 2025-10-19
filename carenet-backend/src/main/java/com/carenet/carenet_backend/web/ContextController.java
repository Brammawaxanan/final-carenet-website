package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.Assignment;
import com.carenet.carenet_backend.domain.User;
import com.carenet.carenet_backend.repo.AssignmentRepo;
import com.carenet.carenet_backend.repo.UserRepo;
import com.carenet.carenet_backend.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/me")
@RequiredArgsConstructor
public class ContextController {

    private final SubscriptionService subscriptionService;
    private final AssignmentRepo assignmentRepo;
    private final UserRepo userRepo;

    // NOTE: For demo, resolve user ID - find first available user if header missing
    private Long resolveUserId(Long headerUserId) { 
        if (headerUserId != null) {
            return headerUserId;
        }
        // Find first available user in the database
        return userRepo.findAll().stream()
                .findFirst()
                .map(User::getId)
                .orElse(null);
    }

    @GetMapping("/context")
    public Map<String, Object> context(@RequestHeader(name="X-User-Id", required=false) Long userIdHeader) {
        Long uid = resolveUserId(userIdHeader);
        
        // Handle Admin user (ID = 0)
        if (uid != null && uid == 0) {
            System.out.println("✅ Returning Admin context");
            return Map.of(
                    "name", "Administrator",
                    "role", "admin",
                    "isSubscribed", true,
                    "hasActiveBooking", false,
                    "currentAssignmentId", 0
            );
        }
        
        if (uid == null) {
            throw new RuntimeException("No users found in database");
        }

        var user = userRepo.findById(uid).orElseThrow(() -> 
            new RuntimeException("User not found with ID: " + uid));
        
        String name = user.getName();
        String role = user.getRole().name().toLowerCase();

        boolean isSubscribed = false;
        try {
            isSubscribed = subscriptionService.isActive(uid);
        } catch (Exception e) {
            System.err.println("Error checking subscription: " + e.getMessage());
        }
        
        var assignments = assignmentRepo.findByClientId(uid);
        boolean hasActiveBooking = assignments.stream().anyMatch(a -> Boolean.TRUE.equals(a.getActive()));
        Long currentAssignmentId = assignments.stream()
                .filter(a -> Boolean.TRUE.equals(a.getActive()))
                .map(Assignment::getId)
                .findFirst()
                .orElse(null);

        return Map.of(
                "name", name,
                "role", role,                 // "client" or "caregiver" (lowercase)
                "isSubscribed", isSubscribed,
                "hasActiveBooking", hasActiveBooking,
                "currentAssignmentId", currentAssignmentId != null ? currentAssignmentId : 0
        );
    }
}