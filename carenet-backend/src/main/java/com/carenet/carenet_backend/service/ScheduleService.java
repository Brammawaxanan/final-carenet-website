package com.carenet.carenet_backend.service;

import com.carenet.carenet_backend.domain.Schedule;
import com.carenet.carenet_backend.repo.ScheduleRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ScheduleService {
    
    private final ScheduleRepo scheduleRepo;
    
    private static final DateTimeFormatter FORMATTER = 
        DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");
    
    /**
     * Check for time conflicts for a caregiver
     * @return Map with conflict status and details
     */
    public Map<String, Object> checkScheduleConflict(Long caregiverId, 
                                                     LocalDateTime startTime, 
                                                     LocalDateTime endTime) {
        Map<String, Object> result = new HashMap<>();
        
        // Find conflicting schedules
        List<Schedule> conflicts = scheduleRepo.findConflictingSchedules(
            caregiverId, startTime, endTime);
        
        boolean hasConflict = !conflicts.isEmpty();
        result.put("hasConflict", hasConflict);
        result.put("conflictCount", conflicts.size());
        
        if (hasConflict) {
            // Add conflict details
            List<Map<String, String>> conflictDetails = new ArrayList<>();
            for (Schedule conflict : conflicts) {
                Map<String, String> detail = new HashMap<>();
                detail.put("startTime", conflict.getStartTime().format(FORMATTER));
                detail.put("endTime", conflict.getEndTime().format(FORMATTER));
                detail.put("bookingId", conflict.getBookingId().toString());
                conflictDetails.add(detail);
            }
            result.put("conflicts", conflictDetails);
            
            // Suggest alternative slots
            List<Map<String, String>> suggestions = suggestAvailableSlots(
                caregiverId, startTime, endTime);
            result.put("suggestedSlots", suggestions);
        } else {
            result.put("message", "Caregiver is available for the requested time");
        }
        
        return result;
    }
    
    /**
     * Suggest next 3 available time slots
     */
    public List<Map<String, String>> suggestAvailableSlots(Long caregiverId, 
                                                           LocalDateTime requestedStart,
                                                           LocalDateTime requestedEnd) {
        List<Map<String, String>> suggestions = new ArrayList<>();
        
        // Get all upcoming schedules
        List<Schedule> upcomingSchedules = scheduleRepo.findUpcomingSchedules(
            caregiverId, requestedStart);
        
        // Calculate duration
        long durationHours = java.time.Duration.between(requestedStart, requestedEnd).toHours();
        if (durationHours == 0) durationHours = 1; // Minimum 1 hour
        
        // Generate suggested slots
        LocalDateTime slotStart = requestedEnd.plusHours(1); // Start after requested time
        int slotsFound = 0;
        int maxAttempts = 20; // Prevent infinite loop
        int attempts = 0;
        
        while (slotsFound < 3 && attempts < maxAttempts) {
            LocalDateTime slotEnd = slotStart.plusHours(durationHours);
            
            // Check if this slot conflicts
            List<Schedule> slotConflicts = scheduleRepo.findConflictingSchedules(
                caregiverId, slotStart, slotEnd);
            
            if (slotConflicts.isEmpty()) {
                // This slot is available
                Map<String, String> slot = new HashMap<>();
                slot.put("startTime", slotStart.format(FORMATTER));
                slot.put("endTime", slotEnd.format(FORMATTER));
                slot.put("duration", durationHours + " hours");
                suggestions.add(slot);
                slotsFound++;
                
                // Move to next day for next suggestion
                slotStart = slotStart.plusDays(1);
            } else {
                // Move past the conflict
                Schedule conflict = slotConflicts.get(0);
                slotStart = conflict.getEndTime().plusHours(1);
            }
            
            attempts++;
        }
        
        return suggestions;
    }
    
    /**
     * Create a new schedule entry
     */
    public Schedule createSchedule(Long caregiverId, Long clientId, Long bookingId, 
                                   LocalDateTime startTime, LocalDateTime endTime) {
        Schedule schedule = new Schedule();
        schedule.setCaregiverId(caregiverId);
        schedule.setClientId(clientId);
        schedule.setBookingId(bookingId);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setStatus("active");
        schedule.setCreatedAt(LocalDateTime.now());

        Schedule saved = scheduleRepo.save(schedule);
        System.out.println("✅ Schedule created: ID=" + saved.getId() + 
                         " for Caregiver=" + caregiverId + " client=" + clientId);
        return saved;
    }
    
    /**
     * Cancel a schedule
     */
    public void cancelSchedule(Long scheduleId) {
        scheduleRepo.findById(scheduleId).ifPresent(schedule -> {
            schedule.setStatus("cancelled");
            scheduleRepo.save(schedule);
            System.out.println("✅ Schedule cancelled: ID=" + scheduleId);
        });
    }
    
    /**
     * Get all schedules for a caregiver
     */
    public List<Schedule> getCaregiverSchedules(Long caregiverId) {
        return scheduleRepo.findByCaregiverIdAndStatus(caregiverId, "active");
    }
    
    /**
     * Check if caregiver is available at specific time
     */
    public boolean isAvailable(Long caregiverId, LocalDateTime startTime, LocalDateTime endTime) {
        List<Schedule> conflicts = scheduleRepo.findConflictingSchedules(
            caregiverId, startTime, endTime);
        return conflicts.isEmpty();
    }
}
