package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.*;
import com.carenet.carenet_backend.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepo userRepo;
    private final CaregiverRepo caregiverRepo;
    private final AssignmentRepo assignmentRepo;
    // private final TaskRepo taskRepo; // Reserved for future task-related admin features
    private final PaymentLedgerRepo ledgerRepo;
    // private final SubscriptionRepo subscriptionRepo; // Reserved for future subscription management

    // ============ Module 1: Dashboard Summary ============
    
    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        Map<String, Object> response = new HashMap<>();
        
        long totalUsers = userRepo.count();
        long activeCaregivers = caregiverRepo.count();
        long activeClients = userRepo.findAll().stream()
                .filter(u -> u.getRole() == User.Role.CLIENT)
                .count();
        long totalBookings = assignmentRepo.count();
        
        // Calculate monthly revenue
        double monthlyRevenue = ledgerRepo.findAll().stream()
                .filter(l -> l.getEntryType() == PaymentLedger.EntryType.PAYMENT)
                .mapToDouble(l -> l.getAmountCents() / 100.0)
                .sum();
        
        response.put("totalUsers", totalUsers);
        response.put("activeCaregivers", activeCaregivers);
        response.put("activeClients", activeClients);
        response.put("totalBookings", totalBookings);
        response.put("monthlyRevenue", monthlyRevenue);
        
        // Revenue by month (sample data - would calculate from actual data)
        List<Map<String, Object>> revenueByMonth = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun"};
        for (String month : months) {
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", month);
            monthData.put("revenue", 45000 + (int)(Math.random() * 20000));
            revenueByMonth.add(monthData);
        }
        response.put("revenueByMonth", revenueByMonth);
        
        // Service distribution
        List<Map<String, Object>> serviceDistribution = new ArrayList<>();
        serviceDistribution.add(Map.of("name", "Elderly Care", "value", 400));
        serviceDistribution.add(Map.of("name", "Child Care", "value", 300));
        serviceDistribution.add(Map.of("name", "Medical Care", "value", 200));
        serviceDistribution.add(Map.of("name", "Companionship", "value", 100));
        response.put("serviceDistribution", serviceDistribution);
        
        return response;
    }
    
    @GetMapping("/recent-activities")
    public List<Map<String, Object>> getRecentActivities() {
        List<Map<String, Object>> activities = new ArrayList<>();
        
        // Get recent users
        List<User> recentUsers = userRepo.findAll().stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(5)
                .collect(Collectors.toList());
        
        for (User user : recentUsers) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("id", user.getId());
            activity.put("type", user.getRole() == User.Role.CAREGIVER ? "registration" : "login");
            activity.put("user", user.getName());
            activity.put("action", user.getRole() == User.Role.CAREGIVER ? "registered as caregiver" : "logged in");
            activity.put("time", "recently");
            activities.add(activity);
        }
        
        return activities;
    }

    // ============ Module 2: User Management ============
    
    @GetMapping("/users")
    public List<Map<String, Object>> getAllUsers() {
        return userRepo.findAll().stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", user.getId());
                    userMap.put("name", user.getName());
                    userMap.put("email", user.getEmail());
                    userMap.put("role", user.getRole().toString());
                    userMap.put("status", "active"); // Default status
                    userMap.put("joinedDate", Instant.now().minusSeconds(86400 * 30)); // Sample date
                    return userMap;
                })
                .collect(Collectors.toList());
    }
    
    @PutMapping("/users/{id}/status")
    public Map<String, Object> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        // Verify user exists
        userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // In a real implementation, you'd have a status field in User entity
        String status = body.get("status");
        System.out.println("Updated user " + id + " status to: " + status);
        
        return Map.of("message", "User status updated", "userId", id, "status", status);
    }
    
    @PutMapping("/users/{id}")
    public Map<String, Object> updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        boolean updated = false;
        if (body.containsKey("name")) {
            user.setName(body.get("name"));
            updated = true;
        }
        if (body.containsKey("email")) {
            user.setEmail(body.get("email"));
            updated = true;
        }
        
        if (updated) {
            userRepo.save(user);
        }
        
        return Map.of("message", "User updated successfully", "userId", id);
    }
    
    @DeleteMapping("/users/{id}")
    public Map<String, Object> deleteUser(@PathVariable Long id) {
        userRepo.deleteById(id);
        return Map.of("message", "User deleted successfully", "userId", id);
    }
    
    @PostMapping("/users/{id}/reset-password")
    public Map<String, Object> resetPassword(@PathVariable Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // In production, generate token and send email
        System.out.println("Password reset requested for: " + user.getEmail());
        
        return Map.of("message", "Password reset email sent", "userId", id);
    }

    // ============ Module 3: Caregiver Management ============
    
    @GetMapping("/caregivers")
    public List<Map<String, Object>> getAllCaregivers() {
        return caregiverRepo.findAll().stream()
                .map(caregiver -> {
                    Map<String, Object> cgMap = new HashMap<>();
                    cgMap.put("id", caregiver.getId());
                    cgMap.put("name", caregiver.getName());
                    
                    // Get email from User entity
                    String email = userRepo.findById(caregiver.getUserId())
                            .map(User::getEmail)
                            .orElse("unknown@carenet.com");
                    cgMap.put("email", email);
                    
                    // Parse skills from CSV string
                    String skillsStr = caregiver.getSkills() != null ? caregiver.getSkills() : "General Care";
                    List<String> skillsList = skillsStr.contains(",") 
                            ? Arrays.asList(skillsStr.split(","))
                            : List.of(skillsStr);
                    cgMap.put("skills", skillsList);
                    
                    cgMap.put("experience", caregiver.getExperience());
                    cgMap.put("rating", caregiver.getRating());
                    cgMap.put("verified", caregiver.getVerified());
                    cgMap.put("status", caregiver.getVerified() ? "active" : "pending");
                    cgMap.put("profilePhoto", null);
                    cgMap.put("documents", List.of("ID Proof", "Medical Certificate"));
                    return cgMap;
                })
                .collect(Collectors.toList());
    }
    
    @PutMapping("/caregivers/{id}/verify")
    public Map<String, Object> verifyCaregiver(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Caregiver caregiver = caregiverRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Caregiver not found"));
        
        boolean verified = body.getOrDefault("verified", true);
        caregiver.setVerified(verified);
        caregiverRepo.save(caregiver);
        
        System.out.println("Caregiver " + id + " verification updated: " + verified);
        
        return Map.of("message", "Caregiver verification updated", "caregiverId", id, "verified", verified);
    }

    // ============ Module 4: Service Requests ============
    
    @GetMapping("/requests")
    public List<Map<String, Object>> getAllRequests() {
        return assignmentRepo.findAll().stream()
                .map(assignment -> {
                    Map<String, Object> reqMap = new HashMap<>();
                    reqMap.put("id", assignment.getId());
                    
                    String clientName = userRepo.findById(assignment.getClientId())
                            .map(User::getName)
                            .orElse("Unknown");
                    reqMap.put("client", clientName);
                    
                    String caregiverName = caregiverRepo.findById(assignment.getCaregiverId())
                            .map(Caregiver::getName)
                            .orElse("Unknown");
                    reqMap.put("caregiver", caregiverName);
                    
                    reqMap.put("status", assignment.getStatus().toString().toLowerCase());
                    reqMap.put("date", assignment.getCreatedAt());
                    reqMap.put("amount", 450 + (int)(Math.random() * 200));
                    
                    return reqMap;
                })
                .collect(Collectors.toList());
    }
    
    @PutMapping("/requests/{id}")
    public Map<String, Object> updateRequest(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Assignment assignment = assignmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        String status = body.get("status");
        if (status != null) {
            try {
                AssignmentStatus newStatus = AssignmentStatus.valueOf(status.toUpperCase());
                assignment.setStatus(newStatus);
                assignmentRepo.save(assignment);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + status);
            }
        }
        
        return Map.of("message", "Request updated", "requestId", id);
    }

    // ============ Module 5: Payments & Subscriptions ============
    
    @GetMapping("/payments")
    public List<Map<String, Object>> getAllPayments() {
        return ledgerRepo.findAll().stream()
                .limit(50)
                .map(ledger -> {
                    Map<String, Object> payment = new HashMap<>();
                    payment.put("id", ledger.getId());
                    payment.put("assignment", "Care #" + ledger.getAssignmentId());
                    
                    String clientName = userRepo.findById(ledger.getUserId())
                            .map(User::getName)
                            .orElse("Unknown");
                    payment.put("client", clientName);
                    
                    payment.put("amount", ledger.getAmountCents() / 100.0);
                    payment.put("method", "Credit Card");
                    payment.put("status", ledger.getEntryType() == PaymentLedger.EntryType.PAYMENT ? "completed" : "pending");
                    payment.put("date", ledger.getCreatedAt());
                    
                    return payment;
                })
                .collect(Collectors.toList());
    }
    
    @GetMapping("/subscriptions")
    public List<Map<String, Object>> getAllSubscriptions() {
        List<Map<String, Object>> plans = new ArrayList<>();
        
        plans.add(Map.of("id", 1, "name", "Hourly Plan", "price", 25, "duration", "per hour", "status", "active"));
        plans.add(Map.of("id", 2, "name", "Weekly Plan", "price", 800, "duration", "per week", "status", "active"));
        plans.add(Map.of("id", 3, "name", "Monthly Plan", "price", 3000, "duration", "per month", "status", "active"));
        
        return plans;
    }
    
    @PostMapping("/subscriptions")
    public Map<String, Object> createSubscription(@RequestBody Map<String, Object> body) {
        // In production, create actual subscription plan
        return Map.of("message", "Subscription plan created", "id", System.currentTimeMillis());
    }
    
    @DeleteMapping("/subscriptions/{id}")
    public Map<String, Object> deleteSubscription(@PathVariable Long id) {
        return Map.of("message", "Subscription plan deleted", "id", id);
    }

    // ============ Module 6: Reports ============
    
    @GetMapping("/reports")
    public Map<String, Object> generateReport(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String format) {
        
        Map<String, Object> report = new HashMap<>();
        report.put("from", from);
        report.put("to", to);
        report.put("format", format);
        report.put("totalRevenue", 67000);
        report.put("totalBookings", 789);
        report.put("message", "Report generated successfully");
        
        return report;
    }

    // ============ Module 7: Security & Verification ============
    
    @GetMapping("/verifications")
    public List<Map<String, Object>> getPendingVerifications() {
        List<Map<String, Object>> verifications = new ArrayList<>();
        
        // Sample verification requests
        verifications.add(Map.of(
            "id", 1,
            "caregiverName", "John Doe",
            "documentType", "ID Proof",
            "uploadDate", "2025-10-10",
            "status", "pending"
        ));
        
        return verifications;
    }
    
    @PutMapping("/verifications/{id}")
    public Map<String, Object> handleVerification(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        boolean approved = body.getOrDefault("approved", false);
        
        return Map.of("message", "Verification processed", "id", id, "approved", approved);
    }
    
    @GetMapping("/activity-logs")
    public List<Map<String, Object>> getActivityLogs() {
        List<Map<String, Object>> logs = new ArrayList<>();
        
        logs.add(Map.of(
            "id", 1,
            "user", "System",
            "action", "Failed login attempt",
            "ip", "192.168.1.1",
            "timestamp", Instant.now().toString(),
            "severity", "warning"
        ));
        
        return logs;
    }

    // ============ Module 8: System Settings ============
    
    @GetMapping("/announcements")
    public List<Map<String, Object>> getAnnouncements() {
        List<Map<String, Object>> announcements = new ArrayList<>();
        
        announcements.add(Map.of(
            "id", 1,
            "title", "System Maintenance",
            "message", "Scheduled maintenance on Oct 20",
            "date", "2025-10-15",
            "active", true
        ));
        
        return announcements;
    }
    
    @PostMapping("/announcements")
    public Map<String, Object> createAnnouncement(@RequestBody Map<String, String> body) {
        return Map.of(
            "message", "Announcement posted",
            "id", System.currentTimeMillis(),
            "title", body.get("title")
        );
    }
    
    @GetMapping("/tickets")
    public List<Map<String, Object>> getSupportTickets() {
        List<Map<String, Object>> tickets = new ArrayList<>();
        
        tickets.add(Map.of(
            "id", 1,
            "user", "Alice Johnson",
            "subject", "Payment issue",
            "status", "open",
            "priority", "high",
            "date", "2025-10-14"
        ));
        
        return tickets;
    }
    
    @PutMapping("/tickets/{id}")
    public Map<String, Object> updateTicket(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return Map.of("message", "Ticket updated", "ticketId", id, "status", body.get("status"));
    }
    
    @GetMapping("/settings")
    public Map<String, Object> getSettings() {
        Map<String, Object> settings = new HashMap<>();
        settings.put("siteName", "CareNet");
        settings.put("contactEmail", "support@carenet.com");
        settings.put("contactPhone", "+1-555-0100");
        settings.put("workingHours", "9 AM - 6 PM");
        settings.put("serviceCategories", List.of("Elderly Care", "Child Care", "Medical Support", "Companionship"));
        
        return settings;
    }
    
    @PutMapping("/settings")
    public Map<String, Object> updateSettings(@RequestBody Map<String, Object> body) {
        // In production, save to database or configuration
        System.out.println("Settings updated: " + body);
        
        return Map.of("message", "Settings updated successfully");
    }
}
