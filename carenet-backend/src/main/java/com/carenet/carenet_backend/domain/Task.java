package com.carenet.carenet_backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "tasks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private Long assignmentId;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 2000)
    private String description;
    private Instant dueAt;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TaskStatus status = TaskStatus.DRAFT;

    @NotNull
    @Column(nullable = false)
    private Boolean isPaid = false;

    @NotBlank
    @Column(nullable = false, length = 20)
    private String createdBy = "CLIENT";

    @NotNull
    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @NotNull
    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}