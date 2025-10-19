package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.Assignment;
import com.carenet.carenet_backend.domain.AssignmentStatus;
import com.carenet.carenet_backend.domain.Schedule;
import com.carenet.carenet_backend.repo.AssignmentRepo;
import com.carenet.carenet_backend.service.ScheduleService;
import com.carenet.carenet_backend.service.QRCodeService;
import com.google.zxing.WriterException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {
    
    private final ScheduleService scheduleService;
    private final AssignmentRepo assignmentRepo;
    private final QRCodeService qrCodeService;
    
    /**
     * SMART FEATURE 3: Check schedule conflicts before booking
     */
    @PostMapping("/checkSchedule")
    public Map<String, Object> checkSchedule(@RequestBody ScheduleCheckRequest request) {
        // Convert Instant to LocalDateTime
        LocalDateTime startTime = LocalDateTime.ofInstant(request.startTime, ZoneId.systemDefault());
        LocalDateTime endTime = LocalDateTime.ofInstant(request.endTime, ZoneId.systemDefault());
        
        // Check for conflicts
        Map<String, Object> conflictResult = scheduleService.checkScheduleConflict(
            request.caregiverId,
            startTime,
            endTime
        );
        
        System.out.println("🔍 Schedule check for Caregiver #" + request.caregiverId + 
                         ": " + ((Boolean)conflictResult.get("hasConflict") ? "CONFLICT" : "AVAILABLE"));
        
        return conflictResult;
    }
    
    /**
     * Confirm booking with automatic QR generation
     */
    @PostMapping("/confirm")
    public Map<String, Object> confirmBooking(
            @RequestHeader(name="X-User-Id", required=false) Long userId,
            @RequestBody BookingConfirmRequest request) {
        
        try {
            Long clientId = userId != null ? userId : 1L;
            
            // Convert times
            LocalDateTime startTime = LocalDateTime.ofInstant(request.startTime, ZoneId.systemDefault());
            LocalDateTime endTime = LocalDateTime.ofInstant(request.endTime, ZoneId.systemDefault());
            
            // Final conflict check
            Map<String, Object> conflictCheck = scheduleService.checkScheduleConflict(
                request.caregiverId, startTime, endTime);
            
            if ((Boolean)conflictCheck.get("hasConflict")) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Caregiver is not available at this time");
                errorResponse.put("conflictDetails", conflictCheck);
                return errorResponse;
            }
            
            // Generate booking ID (in real app, this would be a Booking entity)
            Long bookingId = System.currentTimeMillis();
            
            // Create schedule entry (persist clientId)
            Schedule schedule = scheduleService.createSchedule(
                request.caregiverId,
                clientId,
                bookingId,
                startTime,
                endTime
            );
            
            // Create assignment with QR code
            Assignment assignment = new Assignment();
            assignment.setClientId(clientId);
            assignment.setCaregiverId(request.caregiverId);
            assignment.setBookingId(bookingId);
            assignment.setServiceType(request.serviceType);
            assignment.setStatus(AssignmentStatus.SCHEDULED);
            assignment.setScheduledAt(Instant.now());
            assignment.setCreatedAt(Instant.now());
            assignment.setActive(true);
            
            // Generate verification key and QR code
            String verificationKey = qrCodeService.generateVerificationKey(null, bookingId);
            assignment.setVerificationKey(verificationKey);
            
            Assignment savedAssignment = assignmentRepo.save(assignment);
            
            // Generate QR code for the assignment
            try {
                String qrData = qrCodeService.generateQRData(
                    savedAssignment.getId(),
                    bookingId,
                    verificationKey
                );
                
                String qrCodeBase64 = qrCodeService.generateQRCodeBase64(qrData);
                savedAssignment.setQrCode(qrCodeBase64);
                
                String qrFileName = "assignment_" + savedAssignment.getId();
                String qrFilePath = qrCodeService.generateQRCodeFile(qrData, qrFileName);
                savedAssignment.setQrCodePath(qrFilePath);
                
                assignmentRepo.save(savedAssignment);
                
            } catch (WriterException | IOException e) {
                System.err.println("⚠️ QR code generation failed, but booking confirmed");
            }
            
            System.out.println("✅ Booking confirmed: ID=" + bookingId + 
                             ", Assignment ID=" + savedAssignment.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Booking confirmed successfully");
            response.put("bookingId", bookingId);
            response.put("assignmentId", savedAssignment.getId());
            response.put("scheduleId", schedule.getId());
            response.put("qrCode", savedAssignment.getQrCode());
            response.put("verificationKey", verificationKey);
            response.put("startTime", request.startTime);
            response.put("endTime", request.endTime);
            
            return response;
            
        } catch (Exception e) {
            System.err.println("❌ Booking confirmation failed: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Booking failed: " + e.getMessage());
            return errorResponse;
        }
    }
    
    /**
     * Get suggested available slots
     */
    @GetMapping("/availableSlots/{caregiverId}")
    public Map<String, Object> getAvailableSlots(
            @PathVariable Long caregiverId,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        
        LocalDateTime start = LocalDateTime.parse(startTime);
        LocalDateTime end = LocalDateTime.parse(endTime);
        
        List<Map<String, String>> suggestions = scheduleService.suggestAvailableSlots(
            caregiverId, start, end);
        
        Map<String, Object> response = new HashMap<>();
        response.put("caregiverId", caregiverId);
        response.put("availableSlots", suggestions);
        response.put("count", suggestions.size());
        
        return response;
    }
    
    /**
     * Get caregiver's schedule
     */
    @GetMapping("/schedule/{caregiverId}")
    public Map<String, Object> getCaregiverSchedule(@PathVariable Long caregiverId) {
        List<Schedule> schedules = scheduleService.getCaregiverSchedules(caregiverId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("caregiverId", caregiverId);
        response.put("schedules", schedules);
        response.put("count", schedules.size());
        
        return response;
    }
    
    /**
     * Cancel booking
     */
    @PostMapping("/cancel/{bookingId}")
    public Map<String, Object> cancelBooking(@PathVariable Long bookingId) {
        // Find and cancel schedule
        List<Schedule> schedules = scheduleService.getCaregiverSchedules(bookingId);
        schedules.stream()
                .filter(s -> s.getBookingId().equals(bookingId))
                .forEach(s -> scheduleService.cancelSchedule(s.getId()));
        
        // Deactivate assignments
        assignmentRepo.findAll().stream()
                .filter(a -> a.getBookingId() != null && a.getBookingId().equals(bookingId))
                .forEach(a -> {
                    a.setActive(false);
                    a.setStatus(AssignmentStatus.CANCELLED);
                    assignmentRepo.save(a);
                });
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Booking cancelled successfully");
        response.put("bookingId", bookingId);
        
        return response;
    }
    
    // DTOs
    record ScheduleCheckRequest(
        Long caregiverId,
        Instant startTime,
        Instant endTime
    ) {}
    
    record BookingConfirmRequest(
        Long caregiverId,
        String serviceType,
        String packageType,
        Instant startTime,
        Instant endTime
    ) {}
}
