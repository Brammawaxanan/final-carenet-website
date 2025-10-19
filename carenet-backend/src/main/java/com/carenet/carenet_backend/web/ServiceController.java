package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.Assignment;
import com.carenet.carenet_backend.domain.AssignmentStatus;
import com.carenet.carenet_backend.domain.Caregiver;
import com.carenet.carenet_backend.domain.Task;
import com.carenet.carenet_backend.domain.TaskStatus;
import com.carenet.carenet_backend.repo.AssignmentRepo;
import com.carenet.carenet_backend.repo.CaregiverRepo;
import com.carenet.carenet_backend.repo.TaskRepo;
import com.carenet.carenet_backend.repo.TaskProofRepo;
import com.carenet.carenet_backend.service.SubscriptionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/service")
@RequiredArgsConstructor
public class ServiceController {
    private final CaregiverRepo caregivers;
    private final SubscriptionService subscriptionService;
    private final com.carenet.carenet_backend.service.ScheduleService scheduleService;
    private final AssignmentRepo assignments;
    private final TaskRepo tasks;
    private final TaskProofRepo proofs;

    private Long currentUserId() { return 1L; } // demo fallback

    @GetMapping("/caregivers")
    public Map<String, Object> listCaregivers(
            @RequestHeader(name="X-User-Id", required=false) Long userId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) Double maxHourlyRate,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {

        Long uid = (userId != null ? userId : currentUserId());
        boolean isSubscribed = subscriptionService.isActive(uid);

        // load and filter
        List<Caregiver> all = caregivers.findAll();
        List<Caregiver> filtered = all.stream().filter(c -> {
            boolean ok = true;
            if (serviceType != null && !serviceType.isBlank()) {
                ok &= Optional.ofNullable(c.getServiceTypes()).orElse("")
                        .toLowerCase().contains(serviceType.toLowerCase());
            }
            if (maxHourlyRate != null && c.getHourlyRateCents() != null) {
                ok &= (c.getHourlyRateCents() <= (int) Math.round(maxHourlyRate * 100));
            }
            if (q != null && !q.isBlank()) {
                ok &= Optional.ofNullable(c.getBio()).orElse("")
                        .toLowerCase().contains(q.toLowerCase());
            }
            return ok;
        }).collect(Collectors.toList());

        // rank: rating (desc), price (asc), distance (asc)
        Comparator<Caregiver> comparator = Comparator
                .comparing((Caregiver c) -> Optional.ofNullable(c.getRating()).orElse(0.0)).reversed()
                .thenComparing(c -> Optional.ofNullable(c.getHourlyRateCents()).orElse(Integer.MAX_VALUE))
                .thenComparing(c -> distanceKm(lat, lng, c.getLat(), c.getLng()));
        filtered.sort(comparator);

        // Show ALL caregivers regardless of subscription status
        // Any caregiver who registers will automatically appear in the service page
        
        // Convert caregivers to Map format for consistent frontend consumption
        List<Map<String, Object>> caregiverMaps = filtered.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("userId", c.getUserId());
            map.put("name", c.getName());
            map.put("serviceTypes", c.getServiceTypes());
            map.put("skills", c.getSkills());
            map.put("hourlyRateCents", c.getHourlyRateCents());
            map.put("hourlyRate", c.getHourlyRateCents() != null ? c.getHourlyRateCents() / 100.0 : 0.0);
            map.put("rating", c.getRating());
            map.put("reviewCount", c.getReviewCount());
            map.put("reviewsCount", c.getReviewCount()); // Both formats for compatibility
            map.put("experience", c.getExperience());
            map.put("lat", c.getLat());
            map.put("lng", c.getLng());
            map.put("bio", c.getBio());
            map.put("verified", c.getVerified());
            return map;
        }).collect(Collectors.toList());

        return Map.of(
                "isSubscribed", isSubscribed,
                "caregivers", caregiverMaps
        );
    }

    // List assignments for current client (optionally filter by active)
    @GetMapping("/assignments/mine")
    public List<Assignment> listMyAssignments(@RequestParam(required = false) Boolean active,
                                              @RequestHeader(name="X-User-Id", required=false) Long userId) {
        Long clientId = (userId != null ? userId : currentUserId());
        if (active == null) {
            return assignments.findByClientId(clientId);
        }
        return assignments.findByClientIdAndActive(clientId, active);
    }

    // List assignments for current caregiver (optionally filter by active)
    @GetMapping("/assignments/caregiver/mine")
    public List<Assignment> listMyCaregiverAssignments(@RequestParam(required = false) Boolean active,
                                                        @RequestHeader(name="X-User-Id", required=false) Long userId) {
        Long caregiverId = (userId != null ? userId : currentUserId());
        if (active == null) {
            return assignments.findByCaregiverId(caregiverId);
        }
        return assignments.findByCaregiverIdAndActive(caregiverId, active);
    }

    private double distanceKm(Double lat1, Double lng1, Double lat2, Double lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Double.MAX_VALUE;
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon/2) * Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    @GetMapping("/caregivers/{id}")
    public Map<String, Object> getCaregiverProfile(@PathVariable Long id,
                                                   @RequestHeader(name="X-User-Id", required=false) Long userId) {
        Caregiver caregiver = caregivers.findById(id).orElseThrow(() ->
                new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND,
                        "Caregiver not found"));

        Long uid = (userId != null ? userId : currentUserId());
        
        // Get all assignments for this caregiver with task details
        List<Assignment> caregiverAssignments = assignments.findByCaregiverId(id);
        
        // Build assignment details with client names and task counts
        List<Map<String, Object>> assignmentDetails = caregiverAssignments.stream()
                .map(assignment -> {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("id", assignment.getId());
                    detail.put("clientId", assignment.getClientId());
                    detail.put("serviceType", assignment.getServiceType());
                    detail.put("status", assignment.getStatus());
                    detail.put("active", assignment.getActive());
                    detail.put("scheduledAt", assignment.getScheduledAt());
                    detail.put("startedAt", assignment.getStartedAt());
                    detail.put("completedAt", assignment.getCompletedAt());
                    detail.put("createdAt", assignment.getCreatedAt());
                    
                    // Get client name - will be fetched from User table in the future
                    // For now, just use clientId
                    detail.put("clientName", "Client #" + assignment.getClientId());
                    
                    // Get tasks for this assignment with proofs
                    var assignmentTasks = tasks.findByAssignmentIdOrderByCreatedAtAsc(assignment.getId());
                    
                    // Enrich tasks with proofs
                    var tasksWithProofs = assignmentTasks.stream()
                            .map(task -> {
                                Map<String, Object> taskDetail = new HashMap<>();
                                taskDetail.put("id", task.getId());
                                taskDetail.put("assignmentId", task.getAssignmentId());
                                taskDetail.put("title", task.getTitle());
                                taskDetail.put("description", task.getDescription());
                                taskDetail.put("status", task.getStatus());
                                taskDetail.put("dueAt", task.getDueAt());
                                taskDetail.put("createdBy", task.getCreatedBy());
                                taskDetail.put("createdAt", task.getCreatedAt());
                                taskDetail.put("updatedAt", task.getUpdatedAt());
                                
                                // Get proofs for this task
                                var taskProofs = proofs.findByTaskId(task.getId());
                                taskDetail.put("proofs", taskProofs);
                                
                                return taskDetail;
                            })
                            .collect(Collectors.toList());
                    
                    detail.put("taskCount", assignmentTasks.size());
                    detail.put("tasks", tasksWithProofs);
                    
                    return detail;
                })
                .collect(Collectors.toList());
        
        return Map.of(
                "caregiver", caregiver,
                "isSubscribed", subscriptionService.isActive(uid),
                "assignments", assignmentDetails,
                "totalAssignments", assignmentDetails.size()
        );
    }

    @PostMapping("/request")
    public Map<String, Object> createServiceRequest(@RequestBody ServiceRequest request,
                                                    @RequestHeader(name="X-User-Id", required=false) Long userId) {
        Long uid = (userId != null ? userId : currentUserId());
        boolean isSubscribed = subscriptionService.isActive(uid);

        List<Caregiver> matchedCaregivers = findMatchingCaregivers(request);
        if (!isSubscribed) {
            matchedCaregivers = matchedCaregivers.stream().limit(3).collect(Collectors.toList());
        }
        return Map.of(
                "isSubscribed", isSubscribed,
                "caregivers", matchedCaregivers,
                "matchingCriteria", Map.of(
                        "serviceType", request.getServiceType(),
                        "maxHourlyRate", request.getMaxHourlyRate(),
                        "location", request.getLat() != null && request.getLng() != null ?
                                Map.of("lat", request.getLat(), "lng", request.getLng()) : null
                )
        );
    }

    @PostMapping("/book")
    public Map<String, Object> createBooking(@RequestBody BookRequest req,
                                    @RequestHeader(name="X-User-Id", required=false) Long userId) {
        Long uid = (userId != null ? userId : currentUserId());
        boolean isSubscribed = subscriptionService.isActive(uid);

        Instant start = req.getStartDate() != null ? req.getStartDate().toInstant() : Instant.now();
        Instant end = req.getEndDate() != null ? req.getEndDate().toInstant() : start;

        if (!isSubscribed) {
            long days = Math.max(0, Duration.between(start, end).toDays());
            if (days > 1) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN,
                        "Non-subscribed clients can only book for up to 1 day"
                );
            }
        }

        // Create the assignment
        Assignment a = new Assignment();
        a.setClientId(uid);
        a.setCaregiverId(req.getCaregiverId());
        a.setServiceRequestId(req.getServiceRequestId());
        a.setServiceType(req.getServiceType() != null ? req.getServiceType() : "General Care");
        a.setActive(true);
        a.setStatus(AssignmentStatus.SCHEDULED);
        a.setScheduledAt(start);
        a.setCreatedAt(Instant.now());
        Assignment savedAssignment = assignments.save(a);

    // Automatically create initial task
        Task initialTask = new Task();
        initialTask.setAssignmentId(savedAssignment.getId());
        initialTask.setTitle(req.getServiceType() != null ? req.getServiceType() : "General Care");
        initialTask.setDescription(req.getTaskDescription() != null ? 
            req.getTaskDescription() : 
            "Initial task for " + (req.getServiceType() != null ? req.getServiceType() : "general care") + " service");
        initialTask.setDueAt(start);
        initialTask.setStatus(TaskStatus.DRAFT);
        initialTask.setCreatedBy("CLIENT");
        initialTask.setCreatedAt(Instant.now());
        initialTask.setUpdatedAt(Instant.now());
        Task savedTask = tasks.save(initialTask);

        // Create schedule entry (persist clientId)
        try {
            scheduleService.createSchedule(req.getCaregiverId(), uid, savedAssignment.getId(), java.time.LocalDateTime.ofInstant(start, java.time.ZoneId.systemDefault()), java.time.LocalDateTime.ofInstant(end, java.time.ZoneId.systemDefault()));
        } catch (Exception ex) {
            // ignore schedule creation errors here (not fatal for booking)
        }

        // Return both assignment and task
        return Map.of(
            "assignment", savedAssignment,
            "task", savedTask,
            "message", "Booking successful! Task has been added to your Activity page."
        );
    }

    // --- helpers ---
    private List<Caregiver> findMatchingCaregivers(ServiceRequest request) {
        List<Caregiver> all = caregivers.findAll();
        List<Caregiver> filtered = all.stream().filter(c -> {
            boolean matches = true;
            if (request.getServiceType() != null && !request.getServiceType().isBlank()) {
                matches &= Optional.ofNullable(c.getServiceTypes()).orElse("")
                        .toLowerCase().contains(request.getServiceType().toLowerCase());
            }
            if (request.getMaxHourlyRate() != null && c.getHourlyRateCents() != null) {
                matches &= (c.getHourlyRateCents() <= (int) Math.round(request.getMaxHourlyRate() * 100));
            }
            matches &= Optional.ofNullable(c.getRating()).orElse(0.0) >= 3.0;
            return matches;
        }).collect(Collectors.toList());

        Comparator<Caregiver> comparator = (c1, c2) -> {
            double score1 = calculateMatchScore(c1, request);
            double score2 = calculateMatchScore(c2, request);
            return Double.compare(score2, score1);
        };
        filtered.sort(comparator);
        return filtered;
    }

    private double calculateMatchScore(Caregiver c, ServiceRequest req) {
        double score = 0.0;
        double rating = Optional.ofNullable(c.getRating()).orElse(0.0);
        score += (rating / 5.0) * 0.4;

        if (req.getMaxHourlyRate() != null && c.getHourlyRateCents() != null) {
            double maxRateCents = req.getMaxHourlyRate() * 100;
            double affordabilityScore = Math.max(0, (maxRateCents - c.getHourlyRateCents()) / maxRateCents);
            score += affordabilityScore * 0.3;
        }

        if (req.getLat() != null && req.getLng() != null) {
            double distance = distanceKm(req.getLat(), req.getLng(), c.getLat(), c.getLng());
            if (distance != Double.MAX_VALUE) {
                double distanceScore = Math.max(0, (50 - Math.min(distance, 50)) / 50);
                score += distanceScore * 0.3;
            }
        }
        return score;
    }

    @Data
    public static class ServiceRequest {
        private String serviceType;
        private Double maxHourlyRate;
        private Double lat;
        private Double lng;
        private Date startDate;
        private Date endDate;
    }

    @Data
    public static class BookRequest {
        private Long caregiverId;
        private Long serviceRequestId;
        private Date startDate;
        private Date endDate;
        private String serviceType;  // e.g., "Elder Care", "Pet Care", "Child Care"
        private String taskDescription;  // Optional initial task description
    }
}