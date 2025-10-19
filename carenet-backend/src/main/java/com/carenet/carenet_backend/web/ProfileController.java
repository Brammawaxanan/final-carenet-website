package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.User;
import com.carenet.carenet_backend.domain.Caregiver;
import com.carenet.carenet_backend.repo.UserRepo;
import com.carenet.carenet_backend.repo.CaregiverRepo;
import com.carenet.carenet_backend.service.SubscriptionService;
import com.carenet.carenet_backend.web.dto.ProfileDisplay;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {
    private final UserRepo userRepo;
    private final CaregiverRepo caregiverRepo;
    private final SubscriptionService subscriptionService;

    private Long currentUserId() { return 1L; }

    @GetMapping("/user")
    public Map<String, Object> getUserProfile(@RequestHeader(name="X-User-Id", required=false) Long userId) {
        Long uid = userId != null ? userId : currentUserId();
        User user = userRepo.findById(uid).orElseThrow();
        boolean isPremium = subscriptionService.isActive(uid);

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("avatar", ProfileDisplay.getInitials(user.getName()));
        response.put("isPremium", isPremium);
        response.put("isSubscribed", isPremium);
        
        return response;
    }

    @PutMapping("/user")
    public Map<String, Object> updateUserProfile(
            @RequestHeader(name="X-User-Id", required=false) Long userId,
            @RequestBody UserProfileUpdate update) {
        Long uid = userId != null ? userId : currentUserId();
        User user = userRepo.findById(uid).orElseThrow();

        if (update.name != null) user.setName(update.name);
        if (update.email != null) user.setEmail(update.email);
        user = userRepo.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        response.put("user", getUserProfile(uid));
        
        return response;
    }

    @GetMapping("/caregiver")
    public Map<String, Object> getCaregiverProfile(@RequestHeader(name="X-User-Id", required=false) Long userId) {
        Long uid = userId != null ? userId : currentUserId();
        User user = userRepo.findById(uid).orElseThrow();
        boolean isPremium = subscriptionService.isActive(uid);

        Caregiver caregiver = caregiverRepo.findByUserId(uid)
                .orElseThrow(() -> new RuntimeException("Caregiver profile not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("id", caregiver.getId());
        response.put("name", caregiver.getName());
        response.put("email", user.getEmail());
        response.put("avatar", ProfileDisplay.getInitials(caregiver.getName()));
        response.put("isPremium", isPremium);
        response.put("isSubscribed", isPremium);
        response.put("bio", caregiver.getBio());
        response.put("hourlyRate", caregiver.getHourlyRateCents() != null ? caregiver.getHourlyRateCents() / 100.0 : null);
        response.put("skills", caregiver.getSkills() != null ? caregiver.getSkills().split(",") : new String[]{});
        response.put("experience", caregiver.getExperience());
        response.put("rating", caregiver.getRating());
        response.put("reviews", caregiver.getReviewCount());
        response.put("verified", caregiver.getVerified());
        
        return response;
    }

    @PutMapping("/caregiver")
    public Map<String, Object> updateCaregiverProfile(
            @RequestHeader(name="X-User-Id", required=false) Long userId,
            @RequestBody CaregiverProfileUpdate update) {
        Long uid = userId != null ? userId : currentUserId();

        Caregiver caregiver = caregiverRepo.findByUserId(uid)
                .orElseThrow(() -> new RuntimeException("Caregiver profile not found"));

        if (update.name != null) caregiver.setName(update.name);
        if (update.bio != null) caregiver.setBio(update.bio);
        if (update.hourlyRate != null) caregiver.setHourlyRateCents((int)(update.hourlyRate * 100));
        if (update.experience != null) caregiver.setExperience(update.experience);
        if (update.skills != null && !update.skills.isEmpty()) {
            caregiver.setSkills(String.join(",", update.skills));
        }
        
        caregiver = caregiverRepo.save(caregiver);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        response.put("caregiver", getCaregiverProfile(uid));
        
        return response;
    }

    // DTOs
    record UserProfileUpdate(String name, String email, String phone, String address, String city, String state, String zipCode) {}
    record CaregiverProfileUpdate(String name, String bio, Double hourlyRate, Integer experience, java.util.List<String> skills) {}
}
