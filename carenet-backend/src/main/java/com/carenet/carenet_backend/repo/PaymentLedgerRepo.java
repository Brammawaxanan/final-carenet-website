package com.carenet.carenet_backend.repo;

import com.carenet.carenet_backend.domain.PaymentLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentLedgerRepo extends JpaRepository<PaymentLedger, Long> {
    List<PaymentLedger> findByAssignmentIdOrderByCreatedAtAsc(Long assignmentId);
    List<PaymentLedger> findByUserId(Long userId);
}