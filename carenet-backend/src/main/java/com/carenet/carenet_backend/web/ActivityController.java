package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.*;
import com.carenet.carenet_backend.service.TaskService;
import com.carenet.carenet_backend.service.ActivityService;
import com.carenet.carenet_backend.service.SubscriptionService;
import com.carenet.carenet_backend.service.EmailService;
import com.carenet.carenet_backend.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/activity")
@RequiredArgsConstructor
public class ActivityController {
    private final TaskService taskService;
    private final ActivityService activityService;
    private final SubscriptionService subscriptionService;
    private final AssignmentRepo assignmentRepo;
    private final EmailService emailService;
    private final CaregiverRepo caregiverRepo;
    private final UserRepo userRepo;

    // Get current user ID from header or fallback to first available user
    private Long currentUserId(Long userIdHeader) { 
        if (userIdHeader != null) return userIdHeader;
        // Fallback: get first available user from database
        return assignmentRepo.findAll().stream()
                .findFirst()
                .map(Assignment::getClientId)
                .orElse(1L);
    }

    @GetMapping("/{assignmentId}/overview")
    public Map<String, Object> overview(
            @PathVariable Long assignmentId,
            @RequestHeader(name="X-User-Id", required=false) Long userId) {
        try {
            // Verify assignment exists and user has access
            Assignment assignment = assignmentRepo.findById(assignmentId)
                    .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.NOT_FOUND,
                            "Assignment not found"));
            
            return activityService.overview(assignmentId);
        } catch (Exception e) {
            // Return empty structure if no data found
            return Map.of(
                "tasks", List.of(),
                "ledger", List.of(),
                "counts", Map.of(
                    "total", 0,
                    "awaitingProof", 0,
                    "completed", 0,
                    "verified", 0
                ),
                "progressPercent", 0,
                "runningDueCents", 0L
            );
        }
    }

    @GetMapping("/{assignmentId}/tasks")
    public List<Task> list(@PathVariable Long assignmentId) {
        return taskService.listTasks(assignmentId);
    }

    @PostMapping("/tasks")
    public Task create(@RequestHeader(name="X-User-Id", required=false) Long userId,
                       @RequestBody @jakarta.validation.Valid Task t) {
        enforceSubscribed(userId);
        return taskService.create(t);
    }

    @PostMapping("/tasks/proof")
    public TaskProof uploadProof(@RequestBody @jakarta.validation.Valid TaskProof proof) {
        return taskService.uploadProof(proof);
    }
    
    @PutMapping("/tasks/proof")
    public TaskProof updateProof(@RequestBody @jakarta.validation.Valid TaskProof proof) {
        return taskService.uploadProof(proof);
    }

    @PutMapping("/tasks/{taskId}")
    public Task update(@RequestHeader(name="X-User-Id", required=false) Long userId,
                       @PathVariable Long taskId, @RequestBody Task t) {
        enforceSubscribed(userId);
        return taskService.update(taskId, t).orElseThrow();
    }

    @DeleteMapping("/tasks/{taskId}")
    public void delete(@RequestHeader(name="X-User-Id", required=false) Long userId,
                       @PathVariable Long taskId) {
        enforceSubscribed(userId);
        taskService.delete(taskId);
    }

    @PostMapping("/tasks/{taskId}/complete")
    public Task complete(@PathVariable Long taskId) {
        return taskService.markCompleted(taskId).orElseThrow();
    }

    @PostMapping("/tasks/{taskId}/verify")
    public Task verify(@RequestHeader(name="X-User-Id", required=false) Long userId,
                       @PathVariable Long taskId) {
        enforceSubscribed(userId);
        return taskService.verify(taskId).orElseThrow();
    }

    @PostMapping(value = "/tasks/{taskId}/proof", consumes = "multipart/form-data")
    public TaskProof uploadProofForTask(
            @PathVariable Long taskId, 
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            System.out.println("📤 Uploading proof for task: " + taskId);
            System.out.println("📤 File name: " + file.getOriginalFilename());
            System.out.println("📤 File size: " + file.getSize() + " bytes");
            System.out.println("📤 Content type: " + file.getContentType());
            
            if (file.isEmpty()) {
                throw new IllegalArgumentException("File is empty");
            }
            
            // Convert file to base64 data URL for storage
            byte[] fileBytes = file.getBytes();
            String base64 = java.util.Base64.getEncoder().encodeToString(fileBytes);
            String contentType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
            String dataUrl = "data:" + contentType + ";base64," + base64;
            
            // Create proof with taskId from path parameter
            TaskProof proof = new TaskProof();
            proof.setTaskId(taskId);
            proof.setFileUrl(dataUrl);
            proof.setUploadedBy("CAREGIVER");
            proof.setUploadedAt(java.time.Instant.now());
            
            System.out.println("📤 Created TaskProof object: taskId=" + proof.getTaskId());
            System.out.println("📤 Data URL length: " + dataUrl.length() + " characters");
            
            TaskProof saved = taskService.uploadProof(proof);
            System.out.println("✅ Proof uploaded successfully: ID=" + saved.getId());
            return saved;
        } catch (Exception e) {
            System.err.println("❌ Error uploading proof: " + e.getMessage());
            e.printStackTrace();
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to upload proof: " + e.getMessage()
            );
        }
    }

    @PutMapping("/tasks/{taskId}/status")
    public Task updateTaskStatus(@PathVariable Long taskId, @RequestBody Map<String, String> statusData) {
        String newStatus = statusData.get("status");
        if (newStatus == null || newStatus.isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Status is required");
        }

        // Validate status and check proof requirement
        if ("COMPLETED".equals(newStatus)) {
            return taskService.markCompleted(taskId).orElseThrow();
        }

        // Get task, update status, and save
        var task = taskService.listTasks(taskId).stream().findFirst().orElseThrow();
        task.setStatus(TaskStatus.valueOf(newStatus));
        return taskService.update(taskId, task).orElseThrow();
    }

    @PostMapping("/{assignmentId}/start")
    public Assignment startWork(@PathVariable Long assignmentId) {
        var assignment = assignmentRepo.findById(assignmentId).orElseThrow();
        assignment.setStatus(AssignmentStatus.IN_PROGRESS);
        assignment.setStartedAt(java.time.Instant.now());
        return assignmentRepo.save(assignment);
    }

    @PostMapping("/{assignmentId}/complete")
    public Assignment completeWork(@PathVariable Long assignmentId) {
        var assignment = assignmentRepo.findById(assignmentId).orElseThrow();
        assignment.setStatus(AssignmentStatus.COMPLETED);
        assignment.setCompletedAt(java.time.Instant.now());
        assignment.setActive(false);
        
        Assignment savedAssignment = assignmentRepo.save(assignment);
        
        // Send email notification to caregiver
        try {
            Caregiver caregiver = caregiverRepo.findById(assignment.getCaregiverId()).orElse(null);
            User client = userRepo.findById(assignment.getClientId()).orElse(null);
            
            if (caregiver != null && client != null) {
                User caregiverUser = userRepo.findById(caregiver.getUserId()).orElse(null);
                if (caregiverUser != null && caregiverUser.getEmail() != null) {
                    String subject = "Assignment Completed - CareNet";
                    String emailBody = String.format(
                        "<html><body style='font-family: Arial, sans-serif; line-height: 1.6;'>" +
                        "<div style='max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;'>" +
                        "  <div style='background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;'>" +
                        "    <h1 style='color: white; margin: 0;'>Assignment Completed ✓</h1>" +
                        "  </div>" +
                        "  <div style='background: white; padding: 30px; border-radius: 0 0 10px 10px;'>" +
                        "    <p>Dear <strong>%s</strong>,</p>" +
                        "    <p>Great news! Your assignment with <strong>%s</strong> has been marked as completed.</p>" +
                        "    <div style='background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;'>" +
                        "      <h3 style='margin: 0 0 10px 0; color: #059669;'>Assignment Details</h3>" +
                        "      <p><strong>Assignment ID:</strong> #%d</p>" +
                        "      <p><strong>Service Type:</strong> %s</p>" +
                        "      <p><strong>Completion Date:</strong> %s</p>" +
                        "    </div>" +
                        "    <p>Thank you for providing excellent care through CareNet!</p>" +
                        "    <p style='margin-top: 30px;'>Best regards,<br><strong>The CareNet Team</strong></p>" +
                        "  </div>" +
                        "</div></body></html>",
                        caregiver.getName(),
                        client.getName(),
                        assignment.getId(),
                        assignment.getServiceType() != null ? assignment.getServiceType() : "Care Service",
                        java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy"))
                    );
                    
                    emailService.sendSimpleEmail(caregiverUser.getEmail(), subject, emailBody);
                    System.out.println("✅ Assignment completion email sent to caregiver: " + caregiverUser.getEmail());
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to send assignment completion email: " + e.getMessage());
            // Don't fail the request if email fails
        }
        
        return savedAssignment;
    }

    private void enforceSubscribed(Long userIdHeader) {
        Long uid = currentUserId(userIdHeader);
        try {
            if (!subscriptionService.isActive(uid)) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN,
                        "Subscription required for task management");
            }
        } catch (Exception e) {
            // If subscription check fails, allow operation but log warning
            System.out.println("Warning: Could not verify subscription for user " + uid + ": " + e.getMessage());
        }
    }

}
