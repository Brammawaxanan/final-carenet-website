package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.*;
import com.carenet.carenet_backend.repo.*;
import com.carenet.carenet_backend.service.SubscriptionService;
import com.carenet.carenet_backend.web.dto.ProfileDisplay;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final UserRepo userRepo;
    private final AssignmentRepo assignmentRepo;
    private final CaregiverRepo caregiverRepo;
    private final com.carenet.carenet_backend.repo.ReviewRepo reviewRepo;
    private final TaskRepo taskRepo;
    private final PaymentLedgerRepo ledgerRepo;
    private final SubscriptionService subscriptionService;

    private Long currentUserId() { 
        // Get the first user ID from database (any role)
        try {
            Optional<User> user = userRepo.findAll().stream()
                    .findFirst();
            if (user.isPresent()) {
                Long userId = user.get().getId();
                System.out.println("Found user with ID: " + userId);
                return userId;
            } else {
                System.out.println("No users found in database");
                return null;
            }
        } catch (Exception e) {
            System.err.println("Error finding user: " + e.getMessage());
            return null;
        }
    }

    @GetMapping("/test")
    public Map<String, Object> testEndpoint() {
        System.out.println("Test endpoint called");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "working");
        response.put("userCount", userRepo.count());
        response.put("assignmentCount", assignmentRepo.count());
        response.put("taskCount", taskRepo.count());
        response.put("message", "Dashboard controller is working");
        
        // Add user details for debugging
        List<User> allUsers = userRepo.findAll();
        response.put("firstUserId", allUsers.isEmpty() ? null : allUsers.get(0).getId());
        response.put("currentUserIdMethod", currentUserId());
        
        return response;
    }

    @GetMapping("/users")
    public List<Map<String, Object>> getAllUsers() {
        List<User> allUsers = userRepo.findAll();
        List<Map<String, Object>> userDetails = new ArrayList<>();
        for (User user : allUsers) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("name", user.getName());
            userMap.put("email", user.getEmail());
            userMap.put("role", user.getRole());
            userDetails.add(userMap);
        }
        return userDetails;
    }

    @GetMapping("/context")
    public Map<String, Object> getUserContext(@RequestHeader(name="X-User-Id", required=false) Long userId) {
        try {
            Long uid = userId != null ? userId : currentUserId();
            User user = userRepo.findById(uid).orElseThrow(() -> new RuntimeException("User not found"));
            
            Map<String, Object> context = new HashMap<>();
            context.put("id", user.getId());
            context.put("name", user.getName());
            context.put("email", user.getEmail());
            context.put("role", user.getRole().toString().toLowerCase());
            
            // Check subscription safely
            boolean isPremium = false;
            try {
                isPremium = subscriptionService.isActive(uid);
            } catch (Exception e) {
                System.err.println("Error checking subscription for user " + uid + ": " + e.getMessage());
            }
            
            context.put("isSubscribed", isPremium);
            context.put("isPremium", isPremium);
            
            return context;
        } catch (Exception e) {
            System.err.println("Error in getUserContext: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to load user context");
            errorResponse.put("message", e.getMessage());
            return errorResponse;
        }
    }

    @GetMapping("/user")
    public Map<String, Object> userDashboard(@RequestHeader(name="X-User-Id", required=false) Long userId) {
        try {
            System.out.println("=== DASHBOARD REQUEST START ===");
            Long uid = userId != null ? userId : currentUserId();
            System.out.println("Dashboard request for user ID: " + uid);
            System.out.println("Total users in database: " + userRepo.count());
            
            // Try to find the user, if not found or uid is null, use the first available client user
            User user = null;
            Long selectedUserId = uid;
            if (selectedUserId != null) {
                user = userRepo.findById(selectedUserId).orElse(null);
            }

            if (user == null) {
                System.out.println("User ID " + selectedUserId + " not found or null, finding first available client user");
                user = userRepo.findAll().stream()
                        .filter(u -> u.getRole() == User.Role.CLIENT)
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("No client users found in database"));
                System.out.println("Using fallback user ID: " + user.getId());
            }

            System.out.println("Final user selected: ID=" + user.getId() + ", Name=" + user.getName());

            // Make the selected user id effectively final for use in lambdas
            final Long effectiveUserId = user.getId();

            Map<String, Object> response = new HashMap<>();
            
            // User info
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("name", user.getName());
            userInfo.put("email", user.getEmail());
            
            // Check subscription safely using the actual user ID we found
            boolean isPremium = false;
            try {
                isPremium = subscriptionService.isActive(user.getId());
            } catch (Exception e) {
                System.err.println("Error checking subscription for user " + user.getId() + ": " + e.getMessage());
                // Default to false if subscription check fails
            }
            
            userInfo.put("isSubscribed", isPremium);
            userInfo.put("isPremium", isPremium);
            userInfo.put("avatar", ProfileDisplay.getInitials(user.getName()));
            response.put("user", userInfo);

            // Stats - Enhanced calculations using the actual user ID we found
            List<Assignment> assignments = assignmentRepo.findByClientId(user.getId());
            List<Assignment> activeAssignments = assignments.stream()
                    .filter(Assignment::isActive)
                    .collect(Collectors.toList());
            
            // Get all tasks for active assignments
            List<Task> allTasks = new ArrayList<>();
            for (Assignment a : activeAssignments) {
                allTasks.addAll(taskRepo.findByAssignmentId(a.getId()));
            }
            
            // Calculate task statistics
            long pendingVerifications = allTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.COMPLETED)
                    .count();
            
            long completedTasks = allTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.VERIFIED)
                    .count();
            
            long inProgressTasks = allTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.AWAITING_PROOF)
                    .count();
            
            long draftTasks = allTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DRAFT)
                    .count();

            // Calculate total spent from payment ledger
            double totalSpent = 0.0;
            try {
                totalSpent = ledgerRepo.findByUserId(user.getId()).stream()
                        .filter(l -> l.getEntryType() == PaymentLedger.EntryType.PAYMENT || 
                                   l.getEntryType() == PaymentLedger.EntryType.ACCRUAL)
                        .mapToDouble(l -> l.getAmountCents() / 100.0)
                        .sum();
            } catch (Exception e) {
                System.err.println("Error calculating total spent for user " + user.getId() + ": " + e.getMessage());
            }

            Map<String, Object> stats = new HashMap<>();
            stats.put("activeAssignments", activeAssignments.size());
            stats.put("pendingVerifications", pendingVerifications);
            stats.put("completedTasks", completedTasks);
            stats.put("inProgressTasks", inProgressTasks);
            stats.put("draftTasks", draftTasks);
            stats.put("totalTasks", allTasks.size());
            stats.put("totalSpent", Math.round(totalSpent * 100.0) / 100.0); // Round to 2 decimal places
            response.put("stats", stats);

    // Recent assignments with caregiver details (include reviewable assignments)
    List<Map<String, Object>> recentAssignments = assignments.stream()
        // include assignments that have been completed OR where all tasks are VERIFIED
        .filter(a -> {
            if (a.getCompletedAt() != null) return true;
            List<Task> assignmentTasks = taskRepo.findByAssignmentId(a.getId());
            if (assignmentTasks.isEmpty()) return false;
            boolean allVerified = assignmentTasks.stream().allMatch(t -> t.getStatus() == TaskStatus.VERIFIED);
            return allVerified;
        })
        // sort by completedAt when present, otherwise by createdAt (most recent first)
        .sorted((a1, a2) -> {
            Instant t1 = a1.getCompletedAt() != null ? a1.getCompletedAt() : a1.getCreatedAt();
            Instant t2 = a2.getCompletedAt() != null ? a2.getCompletedAt() : a2.getCreatedAt();
            return t2.compareTo(t1);
        })
        .limit(5)
        .map(a -> {
                    Map<String, Object> aMap = new HashMap<>();
                    aMap.put("id", a.getId());
                    String caregiverName = caregiverRepo.findById(a.getCaregiverId())
                            .map(Caregiver::getName)
                            .orElse("Unknown");
                    aMap.put("caregiverName", caregiverName);
                    aMap.put("caregiverAvatar", ProfileDisplay.getInitials(caregiverName));
                    aMap.put("service", a.getServiceType());
            aMap.put("startDate", a.getCreatedAt());
            aMap.put("completedAt", a.getCompletedAt());
                    
                    List<Task> assignmentTasks = taskRepo.findByAssignmentId(a.getId());
                    long completed = assignmentTasks.stream().filter(t -> t.getStatus() == TaskStatus.VERIFIED).count();
                    long pending = assignmentTasks.stream().filter(t -> t.getStatus() != TaskStatus.VERIFIED).count();
                    
                    aMap.put("tasksCompleted", completed);
                    aMap.put("tasksPending", pending);
                    aMap.put("status", a.getStatus().toString().toLowerCase());
                    // mark reviewable if completedAt set or all tasks verified
                    boolean reviewable = (a.getCompletedAt() != null) || (!assignmentTasks.isEmpty() && assignmentTasks.stream().allMatch(t -> t.getStatus() == TaskStatus.VERIFIED));
                    aMap.put("reviewable", reviewable);
                    // Attach review info if available
                    reviewRepo.findByAssignmentIdAndUserId(a.getId(), effectiveUserId).ifPresent(r -> {
                        aMap.put("rating", r.getRating());
                        aMap.put("review", r.getComment());
                    });
                    return aMap;
                })
                .collect(Collectors.toList());
        response.put("recentAssignments", recentAssignments);

        // Pending tasks for verification
        List<Map<String, Object>> pendingTasks = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED)
                .limit(5)
                .map(t -> {
                    Map<String, Object> tMap = new HashMap<>();
                    tMap.put("id", t.getId());
                    tMap.put("title", t.getTitle());
                    Assignment assignment = assignmentRepo.findById(t.getAssignmentId()).orElse(null);
                    if (assignment != null) {
                        String cgName = caregiverRepo.findById(assignment.getCaregiverId())
                                .map(Caregiver::getName)
                                .orElse("Unknown");
                        tMap.put("caregiverName", cgName);
                    } else {
                        tMap.put("caregiverName", "Unknown");
                    }
                    tMap.put("dueAt", t.getDueAt());
                    tMap.put("status", t.getStatus().toString());
                    return tMap;
                })
                .collect(Collectors.toList());
        response.put("pendingTasks", pendingTasks);

        // Upcoming payments
        List<Map<String, Object>> upcomingPayments = activeAssignments.stream()
                .limit(3)
                .map(a -> {
                    Map<String, Object> pMap = new HashMap<>();
                    pMap.put("id", a.getId());
                    pMap.put("assignmentId", a.getId());
                    String cgName2 = caregiverRepo.findById(a.getCaregiverId())
                            .map(Caregiver::getName)
                            .orElse("Unknown");
                    pMap.put("caregiverName", cgName2);
                    pMap.put("amount", 105000.00); // Rs 105,000.00 (350 USD * 300)
                    pMap.put("dueDate", Instant.now().plusSeconds(7 * 86400)); // 7 days from now
                    pMap.put("status", "pending");
                    return pMap;
                })
                .collect(Collectors.toList());
        response.put("upcomingPayments", upcomingPayments);

        return response;
        } catch (Exception e) {
            System.err.println("Error in userDashboard: " + e.getMessage());
            e.printStackTrace();
            
            // Try one more fallback - get any available user
            try {
                User fallbackUser = userRepo.findAll().stream().findFirst().orElse(null);
                if (fallbackUser != null) {
                    System.out.println("Using emergency fallback user: " + fallbackUser.getId());
                    // Return a minimal response with the fallback user
                    Map<String, Object> response = new HashMap<>();
                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("name", fallbackUser.getName());
                    userInfo.put("email", fallbackUser.getEmail());
                    userInfo.put("avatar", ProfileDisplay.getInitials(fallbackUser.getName()));
                    userInfo.put("isSubscribed", false);
                    userInfo.put("isPremium", false);
                    response.put("user", userInfo);
                    
                    // Empty stats
                    Map<String, Object> stats = new HashMap<>();
                    stats.put("activeAssignments", 0);
                    stats.put("pendingVerifications", 0);
                    stats.put("completedTasks", 0);
                    stats.put("totalSpent", 0.0);
                    response.put("stats", stats);
                    
                    response.put("pendingTasks", new ArrayList<>());
                    response.put("upcomingPayments", new ArrayList<>());
                    response.put("recentAssignments", new ArrayList<>());
                    
                    return response;
                }
            } catch (Exception fallbackError) {
                System.err.println("Fallback also failed: " + fallbackError.getMessage());
            }
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to load dashboard data");
            errorResponse.put("message", e.getMessage());
            return errorResponse;
        }
    }

    @GetMapping("/caregiver")
    public Map<String, Object> caregiverDashboard(@RequestHeader(name="X-User-Id", required=false) Long userId) {
        Long uid = userId != null ? userId : currentUserId();
        User user = userRepo.findById(uid).orElseThrow();

        Map<String, Object> response = new HashMap<>();
        
        // Caregiver info - prefer the persisted Caregiver entity when available to avoid duplicates
        Map<String, Object> caregiverInfo = new HashMap<>();
        Optional<Caregiver> cgOpt = caregiverRepo.findByUserId(uid);
        if (cgOpt.isPresent()) {
            Caregiver cg = cgOpt.get();
            caregiverInfo.put("name", cg.getName() != null ? cg.getName() : user.getName());
            caregiverInfo.put("rating", cg.getRating() != null ? cg.getRating() : 4.8);
            caregiverInfo.put("reviewCount", cg.getReviewCount() != null ? cg.getReviewCount() : 0);
            // Store hourly rate as the same unit used elsewhere (stored in cents here)
            caregiverInfo.put("hourlyRate", cg.getHourlyRateCents() != null ? cg.getHourlyRateCents() : 0);
            caregiverInfo.put("avatar", ProfileDisplay.getInitials(cg.getName() != null ? cg.getName() : user.getName()));
            caregiverInfo.put("isPremium", subscriptionService.isActive(uid));
            response.put("caregiver", caregiverInfo);

            // include application details derived from the persisted caregiver
            try {
                Map<String, Object> app = new HashMap<>();
                app.put("applicationId", cg.getId());
                // Ensure verificationCode exists for already-verified caregivers
                if (Boolean.TRUE.equals(cg.getVerified()) && (cg.getVerificationCode() == null || cg.getVerificationCode().isBlank())) {
                    String newCode = UUID.randomUUID().toString();
                    cg.setVerificationCode(newCode);
                    caregiverRepo.save(cg);
                    System.out.println("[DashboardController] Generated missing verificationCode for caregiverId=" + cg.getId() + ": " + newCode);
                }
                app.put("verified", cg.getVerified());
                app.put("bio", cg.getBio());
                app.put("skills", cg.getSkills());
                app.put("experience", cg.getExperience());
                app.put("hourlyRateCents", cg.getHourlyRateCents());
                    app.put("verificationCode", cg.getVerificationCode());
                app.put("serviceTypes", cg.getServiceTypes());
                response.put("caregiverApplication", app);
                // Diagnostic log to help trace whether verification fields are present
                try {
                    System.out.println("[DashboardController] Returning caregiver dashboard for userId=" + uid + ", caregiverId=" + cg.getId() + ", verified=" + cg.getVerified() + ", verificationCode=" + cg.getVerificationCode());
                } catch (Exception ignored) {}
            } catch (Exception ignored) {}

            // use the caregiver entity id for assignments lookup
            // (caregiverEntityId defined below)
        } else {
            // fallback to User values if no Caregiver entity exists
            caregiverInfo.put("name", user.getName());
            caregiverInfo.put("rating", 4.8);
            caregiverInfo.put("reviewCount", 24);
            caregiverInfo.put("hourlyRate", 10500);
            caregiverInfo.put("avatar", ProfileDisplay.getInitials(user.getName()));
            caregiverInfo.put("isPremium", subscriptionService.isActive(uid));
            response.put("caregiver", caregiverInfo);
        }

        // Stats - for caregiver, assignments where they are the provider
        Long caregiverEntityId = cgOpt.map(Caregiver::getId).orElse(-1L);
        List<Assignment> assignments = assignmentRepo.findAll().stream()
                .filter(a -> a.getCaregiverId() != null && a.getCaregiverId().equals(caregiverEntityId))
                .collect(Collectors.toList());
        
        List<Assignment> activeAssignments = assignments.stream()
                .filter(Assignment::isActive)
                .collect(Collectors.toList());

        List<Task> allTasks = new ArrayList<>();
        for (Assignment a : activeAssignments) {
            allTasks.addAll(taskRepo.findByAssignmentId(a.getId()));
        }

        long tasksCompleted = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.VERIFIED).count();
        long proofUploaded = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED || t.getStatus() == TaskStatus.VERIFIED).count();
        
        double totalEarned = 960000.00; // Rs 960,000.00 (3200 USD * 300)

        Map<String, Object> stats = new HashMap<>();
        stats.put("activeAssignments", activeAssignments.size());
        stats.put("tasksCompleted", tasksCompleted);
        stats.put("proofUploaded", proofUploaded);
        stats.put("totalEarned", totalEarned);
        response.put("stats", stats);

        // Active assignments
        List<Map<String, Object>> activeAssignmentsList = activeAssignments.stream()
                .map(a -> {
                    Map<String, Object> aMap = new HashMap<>();
                    aMap.put("id", a.getId());
                    String clientName = userRepo.findById(a.getClientId()).map(User::getName).orElse("Client");
                    aMap.put("clientName", clientName);
                    aMap.put("clientAvatar", ProfileDisplay.getInitials(clientName));
                    aMap.put("service", a.getServiceType());
                    aMap.put("startDate", a.getCreatedAt());
                    
                    List<Task> assignmentTasks = taskRepo.findByAssignmentId(a.getId());
                    long completed = assignmentTasks.stream().filter(t -> t.getStatus() == TaskStatus.VERIFIED).count();
                    long pending = assignmentTasks.stream().filter(t -> t.getStatus() != TaskStatus.VERIFIED).count();
                    
                    aMap.put("tasksTotal", assignmentTasks.size());
                    aMap.put("tasksCompleted", completed);
                    aMap.put("tasksPending", pending);
                    aMap.put("status", a.getStatus().toString().toLowerCase());
                    
                    // Next task
                    Optional<Task> nextTask = assignmentTasks.stream()
                            .filter(t -> t.getStatus() == TaskStatus.DRAFT)
                            .findFirst();
                    if (nextTask.isPresent()) {
                        Map<String, Object> nextTaskMap = new HashMap<>();
                        nextTaskMap.put("title", nextTask.get().getTitle());
                        nextTaskMap.put("dueAt", nextTask.get().getDueAt());
                        aMap.put("nextTask", nextTaskMap);
                    }
                    
                    return aMap;
                })
                .collect(Collectors.toList());
        response.put("activeAssignments", activeAssignmentsList);

        // Pending tasks (today's tasks)
        List<Map<String, Object>> pendingTasks = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DRAFT || t.getStatus() == TaskStatus.AWAITING_PROOF)
                .limit(5)
                .map(t -> {
                    Map<String, Object> tMap = new HashMap<>();
                    tMap.put("id", t.getId());
                    tMap.put("title", t.getTitle());
                    tMap.put("clientName", userRepo.findById(
                            assignmentRepo.findById(t.getAssignmentId()).map(Assignment::getClientId).orElse(null)
                    ).map(User::getName).orElse("Client"));
                    tMap.put("dueAt", t.getDueAt());
                    return tMap;
                })
                .collect(Collectors.toList());
        response.put("pendingTasks", pendingTasks);

        // Recent earnings (amounts in LKR)
        List<Map<String, Object>> recentEarnings = List.of(
                Map.of("id", 1, "clientName", "Alice Johnson", "amount", 84000.00, "date", Instant.now().minusSeconds(86400), "status", "paid"), // Rs 84,000 (280 USD * 300)
                Map.of("id", 2, "clientName", "Bob Smith", "amount", 105000.00, "date", Instant.now().minusSeconds(172800), "status", "paid") // Rs 105,000 (350 USD * 300)
        );
        response.put("recentEarnings", recentEarnings);

        return response;
    }

    @GetMapping("/admin")
    public Map<String, Object> adminDashboard() {
        Map<String, Object> response = new HashMap<>();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepo.count());
        stats.put("totalCaregivers", userRepo.findAll().stream().filter(u -> u.getRole() == User.Role.CAREGIVER).count());
        stats.put("activeAssignments", assignmentRepo.findAll().stream().filter(Assignment::isActive).count());
        stats.put("monthlyRevenue", 45230);
        stats.put("pendingApprovals", 12);
        response.put("stats", stats);

    List<Map<String, Object>> recentUsers = userRepo.findAll().stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(10)
                .map(u -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", u.getId());
                    userMap.put("name", u.getName());
                    userMap.put("email", u.getEmail());
                    userMap.put("role", u.getRole().toString().toLowerCase());
                    userMap.put("joined", Instant.now().minusSeconds(86400 * (int)(Math.random() * 30)));
                    userMap.put("status", Math.random() > 0.3 ? "active" : "pending");
                    return userMap;
                })
                .collect(Collectors.toList());
        response.put("recentUsers", recentUsers);

    // Recent reviews (latest 10)
    List<Map<String, Object>> recentReviews = reviewRepo.findAll().stream()
        .sorted((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt()))
        .limit(10)
        .map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("rating", r.getRating());
            m.put("comment", r.getComment());
            m.put("userId", r.getUserId());
            m.put("assignmentId", r.getAssignmentId());
            m.put("createdAt", r.getCreatedAt());
            // try to resolve user name
            userRepo.findById(r.getUserId()).ifPresent(u -> m.put("userName", u.getName()));
            return m;
        })
        .collect(Collectors.toList());
    response.put("recentReviews", recentReviews);

        // All reviews (full list) - include related context where possible
        List<Map<String, Object>> allReviews = reviewRepo.findAll().stream()
                .sorted((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt()))
                .map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("rating", r.getRating());
                    m.put("comment", r.getComment());
                    m.put("userId", r.getUserId());
                    m.put("assignmentId", r.getAssignmentId());
                    m.put("createdAt", r.getCreatedAt());
                    userRepo.findById(r.getUserId()).ifPresent(u -> m.put("userName", u.getName()));
                    // try to include caregiver name from assignment
                    try {
                        assignmentRepo.findById(r.getAssignmentId()).ifPresent(a -> {
                            if (a.getCaregiverId() != null) {
                                caregiverRepo.findById(a.getCaregiverId()).ifPresent(cg -> m.put("caregiverName", cg.getName()));
                            }
                        });
                    } catch (Exception ignored) {}
                    return m;
                })
                .collect(Collectors.toList());
        response.put("allReviews", allReviews);

        return response;
    }
}
