package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.User;
import com.carenet.carenet_backend.domain.Caregiver;
import com.carenet.carenet_backend.repo.UserRepo;
import com.carenet.carenet_backend.repo.CaregiverRepo;
import com.carenet.carenet_backend.service.SubscriptionService;
import com.carenet.carenet_backend.web.dto.ProfileDisplay;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepo userRepo;
    private final CaregiverRepo caregiverRepo;
    private final SubscriptionService subscriptionService;
    private final com.carenet.carenet_backend.service.OtpService otpService;

    // Fixed Admin credentials
    private static final String ADMIN_EMAIL = "admin@carenet.com";
    private static final String ADMIN_PASSWORD = "Admin@123";
    private static final String ADMIN_NAME = "Administrator";

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        try {
            // Check if admin login
            if (ADMIN_EMAIL.equalsIgnoreCase(request.email)) {
                if (!ADMIN_PASSWORD.equals(request.password)) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("error", "Invalid credentials");
                    error.put("message", "Invalid email or password");
                    return ResponseEntity.status(401).body(error);
                }
                
                // Return admin response
                Map<String, Object> response = new HashMap<>();
                response.put("token", generateToken("admin", 0L));
                response.put("userId", 0L); // Admin ID is 0
                response.put("name", ADMIN_NAME);
                response.put("email", ADMIN_EMAIL);
                response.put("role", "ADMIN");
                response.put("avatar", "AD");
                response.put("isPremium", true);
                response.put("isSubscribed", true);
                
                System.out.println("✅ Admin login successful");
                return ResponseEntity.ok(response);
            }

            // Regular user login
            User user = userRepo.findByEmail(request.email).orElse(null);
            
            if (user == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Invalid credentials");
                error.put("message", "Invalid email or password");
                return ResponseEntity.status(401).body(error);
            }

            // Verify password first (in production, use BCrypt)
            if (!user.getPasswordHash().equals(request.password)) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Invalid credentials");
                error.put("message", "Invalid email or password");
                return ResponseEntity.status(401).body(error);
            }

            // Check email verification
            if (!user.isEmailVerified()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Email not verified");
                error.put("message", "Please verify your email before logging in. Check your inbox for the verification code.");
                error.put("email", user.getEmail());
                error.put("userId", user.getId());
                error.put("requiresVerification", true);
                return ResponseEntity.status(403).body(error);
            }

            boolean isPremium = subscriptionService.isActive(user.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("token", generateToken(user.getRole().toString(), user.getId()));
            response.put("userId", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole().toString());
            response.put("avatar", ProfileDisplay.getInitials(user.getName()));
            response.put("isPremium", isPremium);
            response.put("isSubscribed", isPremium);

            System.out.println("✅ User login successful: " + user.getEmail() + " (Role: " + user.getRole() + ")");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Login error: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Login failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        try {
            // Prevent admin registration
            if ("ADMIN".equalsIgnoreCase(request.role)) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Invalid role");
                error.put("message", "Admin users cannot register through this endpoint");
                return ResponseEntity.status(400).body(error);
            }
            
            // Prevent using admin email
            if (ADMIN_EMAIL.equalsIgnoreCase(request.email)) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Email reserved");
                error.put("message", "This email is reserved");
                return ResponseEntity.status(400).body(error);
            }

            // Check if email exists
            if (userRepo.findByEmail(request.email).isPresent()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Email exists");
                error.put("message", "Email already registered. Please login instead.");
                return ResponseEntity.status(409).body(error);
            }
            
            // Validate role
            String roleUpper = request.role.toUpperCase();
            if (!roleUpper.equals("CLIENT") && !roleUpper.equals("CAREGIVER")) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Invalid role");
                error.put("message", "Invalid role. Only CLIENT and CAREGIVER are allowed");
                return ResponseEntity.status(400).body(error);
            }

            // Create user
            User user = new User();
            user.setName(request.name);
            user.setEmail(request.email);
            user.setPasswordHash(request.password); // In production, hash the password
            user.setRole(User.Role.valueOf(roleUpper));
            user.setEmailVerified(false);
            user = userRepo.save(user);

            // If caregiver, create caregiver profile
            if (user.getRole() == User.Role.CAREGIVER) {
                Caregiver caregiver = new Caregiver();
                caregiver.setUserId(user.getId());
                caregiver.setName(request.name);
                caregiver.setBio(request.bio != null ? request.bio : "Experienced caregiver");
                caregiver.setHourlyRateCents(request.hourlyRate != null ? (int)(request.hourlyRate * 100) : 2500);
                caregiver.setRating(5.0);
                caregiver.setReviewCount(0);
                caregiver.setExperience(request.experience != null ? request.experience : 0);
                caregiver.setSkills(request.skills != null ? String.join(",", request.skills) : "Elderly Care");
                caregiver.setVerified(false);
                caregiverRepo.save(caregiver);
            }

            // After registration, require email verification. Send OTP to user's email.
            String otpForDev = otpService.generateAndSendOtp(user.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Registration successful! Please verify your email.");
            response.put("userId", user.getId());
            response.put("email", user.getEmail());
            response.put("name", user.getName());
            response.put("role", user.getRole().toString());
            response.put("avatar", ProfileDisplay.getInitials(user.getName()));
            response.put("isPremium", false);
            response.put("isSubscribed", false);
            response.put("requiresVerification", true);
            // DEV helper: include OTP in response (do NOT enable in production)
            response.put("devOtp", otpForDev);

            System.out.println("✅ User registered successfully (verification pending): " + user.getEmail() + " (Role: " + user.getRole() + ") - OTP: " + otpForDev);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Registration error: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Registration failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    // Generate JWT-like token (in production, use proper JWT library)
    private String generateToken(String role, Long userId) {
        // Format: jwt.{role}.{userId}.{timestamp}
        long timestamp = System.currentTimeMillis();
        return String.format("jwt.%s.%d.%d", role.toLowerCase(), userId, timestamp);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody SendOtpRequest request) {
        // Basic validation
        if (request.email == null || request.email.isBlank()) {
            throw new RuntimeException("Email is required");
        }

        // Generate and send OTP
        String otpForTesting = otpService.generateAndSendOtp(request.email);

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        // NOTE: For tests/dev we include the code; in production do not return the code
        resp.put("code", otpForTesting);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody VerifyOtpRequest request) {
        if (request.email == null || request.email.isBlank() || request.code == null || request.code.isBlank()) {
            throw new RuntimeException("Email and code are required");
        }

        boolean ok = otpService.verifyOtp(request.email, request.code);
        Map<String, Object> resp = new HashMap<>();
        resp.put("verified", ok);
        resp.put("success", ok);
        return ResponseEntity.ok(resp);
    }

    // DTOs
    record LoginRequest(String email, String password) {}
    
    record RegisterRequest(
            String name,
            String email,
            String password,
            String phone,
            String address,
            String city,
            String state,
            String zipCode,
            String role, // "client" or "caregiver"
            String bio,
            Double hourlyRate,
            Integer experience,
            java.util.List<String> skills
    ) {}

    record SendOtpRequest(String email) {}
    record VerifyOtpRequest(String email, String code) {}
}
