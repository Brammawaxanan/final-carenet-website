package com.carenet.carenet_backend.repo;

import com.carenet.carenet_backend.domain.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScheduleRepo extends JpaRepository<Schedule, Long> {
    
    List<Schedule> findByCaregiverId(Long caregiverId);
    
    List<Schedule> findByBookingId(Long bookingId);
    
    List<Schedule> findByCaregiverIdAndStatus(Long caregiverId, String status);
    
    // Find overlapping schedules for a caregiver
    @Query("SELECT s FROM Schedule s WHERE s.caregiverId = :caregiverId " +
           "AND s.status = 'active' " +
           "AND ((s.startTime <= :endTime AND s.endTime >= :startTime))")
    List<Schedule> findConflictingSchedules(Long caregiverId, LocalDateTime startTime, LocalDateTime endTime);
    
    // Find next available slots for a caregiver
    @Query("SELECT s FROM Schedule s WHERE s.caregiverId = :caregiverId " +
           "AND s.status = 'active' " +
           "AND s.startTime >= :fromTime " +
           "ORDER BY s.startTime ASC")
    List<Schedule> findUpcomingSchedules(Long caregiverId, LocalDateTime fromTime);
}
