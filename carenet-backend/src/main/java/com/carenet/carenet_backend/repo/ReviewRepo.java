package com.carenet.carenet_backend.repo;

import com.carenet.carenet_backend.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepo extends JpaRepository<Review, Long> {
    List<Review> findByUserId(Long userId);
    Optional<Review> findByAssignmentIdAndUserId(Long assignmentId, Long userId);
    List<Review> findByAssignmentId(Long assignmentId);
}
