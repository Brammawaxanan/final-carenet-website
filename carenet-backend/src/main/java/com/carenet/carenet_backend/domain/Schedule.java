package com.carenet.carenet_backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "schedules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Schedule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long caregiverId;
    
    @Column(nullable = false)
    private Long clientId;
    
    @Column(nullable = false)
    private LocalDateTime startTime;
    
    @Column(nullable = false)
    private LocalDateTime endTime;
    
    @Column(nullable = false)
    private Long bookingId;
    
    @Column(nullable = false)
    private String status = "active"; // active, cancelled, completed
    
    @Column
    private LocalDateTime createdAt = LocalDateTime.now();
}
