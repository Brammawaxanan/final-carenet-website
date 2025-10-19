package com.carenet.carenet_backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "task_proofs", indexes = {
        @Index(name = "idx_task_proofs_task_id", columnList = "taskId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TaskProof {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private Long taskId;

    @NotBlank
    @Column(nullable = false, length = 20)
    private String uploadedBy = "CAREGIVER";

    @NotBlank
    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String fileUrl;

    @NotNull
    @Column(nullable = false)
    private Instant uploadedAt = Instant.now();
}