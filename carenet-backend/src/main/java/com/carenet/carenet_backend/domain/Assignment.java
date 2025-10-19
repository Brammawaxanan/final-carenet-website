package com.carenet.carenet_backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private Long clientId;      // Client user ID

    @NotNull
    @Column(nullable = false)
    private Long caregiverId;   // Provider (Caregiver.id)
    private Long serviceRequestId;
    
    private String serviceType;

    @NotNull
    @Column(nullable = false)
    private Boolean active = true;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AssignmentStatus status = AssignmentStatus.SCHEDULED;

    @NotNull
    @Column(nullable = false)
    private Instant scheduledAt = Instant.now();
    private Instant startedAt;
    private Instant completedAt;
    private Instant createdAt = Instant.now();
    
    // QR Code fields for smart verification
    @Column(length = 10000)
    private String qrCode; // Base64 encoded QR image
    
    @Column(length = 500)
    private String qrCodePath; // File path to QR code image
    
    @Column(length = 255)
    private String verificationKey; // Unique verification key for QR
    
    private Long bookingId; // Reference to booking
    
    // Helper method
    public boolean isActive() {
        return active != null && active;
    }
}