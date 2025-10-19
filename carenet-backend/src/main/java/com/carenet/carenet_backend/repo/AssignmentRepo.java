package com.carenet.carenet_backend.repo;

import com.carenet.carenet_backend.domain.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssignmentRepo extends JpaRepository<Assignment, Long> {
    List<Assignment> findByClientId(Long clientId);
    List<Assignment> findByClientIdAndActive(Long clientId, Boolean active);
    List<Assignment> findByCaregiverId(Long caregiverId);
    List<Assignment> findByCaregiverIdAndActive(Long caregiverId, Boolean active);
    List<Assignment> findByBookingId(Long bookingId);
}