package com.carenet.carenet_backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "subscriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private Long userId;

    @NotBlank
    @Column(nullable = false, length = 30)
    private String tier = "FREE"; // FREE, BASIC, PREMIUM

    @NotNull
    @Column(nullable = false)
    private Instant startDate;

    @NotNull
    @Column(nullable = false)
    private Instant endDate;

    @NotNull
    @Column(nullable = false)
    private Boolean active = false;

    @NotNull
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
    
    // Billing fields
    @Column(nullable = false)
    private Long amountCents = 0L; // Subscription amount in cents
    
    @Column(length = 20)
    private String billingCycle = "MONTHLY"; // MONTHLY, QUARTERLY, YEARLY
    
    private Instant nextBillingAt; // Next billing date
    
    @Column(length = 20)
    private String status = "ACTIVE"; // ACTIVE, PAUSED, CANCELLED
    
    @Column(length = 50)
    private String paymentMethod; // Card type for auto-billing
}