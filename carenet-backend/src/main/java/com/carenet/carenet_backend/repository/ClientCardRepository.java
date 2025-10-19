package com.carenet.carenet_backend.repository;

import com.carenet.carenet_backend.model.ClientCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientCardRepository extends JpaRepository<ClientCard, Long> {
    
    /**
     * Find all cards for a specific user
     */
    List<ClientCard> findByUserIdOrderByAddedAtDesc(Long userId);
    
    /**
     * Find a specific card by user and card ID
     */
    Optional<ClientCard> findByIdAndUserId(Long id, Long userId);
    
    /**
     * Find the default card for a user
     */
    Optional<ClientCard> findByUserIdAndIsDefaultTrue(Long userId);
    
    /**
     * Count cards for a user
     */
    long countByUserId(Long userId);
    
    /**
     * Check if a card token already exists for a user
     */
    boolean existsByUserIdAndCardToken(Long userId, String cardToken);
}
