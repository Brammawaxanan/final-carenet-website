package com.carenet.carenet_backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "caregiver_documents", indexes = {
        @Index(name = "idx_cg_docs_caregiver_id", columnList = "caregiverId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CaregiverDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private Long caregiverId;

    @NotBlank
    @Column(nullable = false, length = 300)
    private String fileName;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String contentType;

    @Lob
    @NotBlank
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String fileUrl; // stored as data:<contentType>;base64,<data>

    // Optional category (id, medical, license, background, training, references)
    @Column(length = 50)
    private String category;

    @NotNull
    @Column(nullable = false)
    private Instant uploadedAt = Instant.now();

    // Approval fields
    @Column(nullable = false)
    private Boolean approved = false;

    @Column(length = 200)
    private String approvedBy;

    private Instant approvedAt;
}
