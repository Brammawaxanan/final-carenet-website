package com.carenet.carenet_backend.repo;

import com.carenet.carenet_backend.domain.Caregiver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CaregiverRepo extends JpaRepository<Caregiver, Long> {
    Optional<Caregiver> findByUserId(Long userId);
    @Query("SELECT c FROM Caregiver c WHERE c.serviceTypes LIKE %:serviceType%")
    List<Caregiver> findByServiceTypesContaining(@Param("serviceType") String serviceType);
    
    @Query("SELECT c FROM Caregiver c WHERE c.hourlyRateCents <= :maxRate")
    List<Caregiver> findByHourlyRateCentsLessThanEqual(@Param("maxRate") Integer maxRate);
    
    @Query("SELECT c FROM Caregiver c WHERE c.rating >= :minRating")
    List<Caregiver> findByRatingGreaterThanEqual(@Param("minRating") Double minRating);
}