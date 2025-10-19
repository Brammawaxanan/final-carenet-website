package com.carenet.carenet_backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "payment_ledgers", indexes = {
        @Index(name = "idx_ledger_user", columnList = "userId"),
        @Index(name = "idx_ledger_assignment", columnList = "assignmentId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PaymentLedger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private Long userId;

    private Long assignmentId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EntryType entryType; // ACCRUAL, PAYMENT, ADJUSTMENT

    @NotNull
    @Column(nullable = false)
    private Long amountCents;

    @Column(length = 500)
    private String note;

    @NotNull
    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(length = 100)
    private String externalRef;
    
    // Additional fields for smart receipt system
    private Long bookingId;
    
    @Column(length = 50)
    private String paymentMethod; // Credit Card, PayPal, etc.
    
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String receiptPath; // Base64 encoded receipt file or path to generated PDF receipt
    
    @Column(length = 20)
    private String status = "pending"; // pending, completed, failed, refunded
    
    private Instant paidAt; // When payment was completed
    
    @Column(nullable = false)
    private Boolean isRefunded = false; // Whether payment was refunded
    
    private Instant refundedAt; // When refund was processed
    
    @Column(length = 500)
    private String refundReason; // Reason for refund

    public enum EntryType { ACCRUAL, PAYMENT, ADJUSTMENT }
}