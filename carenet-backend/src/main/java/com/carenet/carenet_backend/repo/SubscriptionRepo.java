package com.carenet.carenet_backend.repo;

import com.carenet.carenet_backend.domain.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepo extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findTopByUserIdOrderByEndDateDesc(Long userId);
    Optional<Subscription> findByUserIdAndActive(Long userId, Boolean active);
    List<Subscription> findByUserId(Long userId);
}