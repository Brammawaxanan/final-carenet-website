package com.carenet.carenet_backend.repo;

import com.carenet.carenet_backend.domain.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpCodeRepo extends JpaRepository<OtpCode, Long> {
    Optional<OtpCode> findTopByEmailAndUsedOrderByExpiresAtDesc(String email, boolean used);
}
