package com.carenet.carenet_backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "caregivers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Caregiver {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private Long userId;   // Reference to User.id

    @NotBlank
    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String serviceTypes;   // CSV string

    @Column(length = 500)
    private String skills;         // CSV string of skills

    @NotNull
    @Column(nullable = false)
    private Integer hourlyRateCents; // store in cents; derive dollars in responses

    @DecimalMin("0.0")
    @DecimalMax("5.0")
    @Column(nullable = false)
    private Double rating = 5.0;

    @Column(nullable = false)
    private Integer reviewCount = 0;
 
    @Min(0)
    @Column(nullable = false)
    private Integer experience = 0;   // Years of experience

    private Double lat;
    private Double lng;

    @Column(length = 1000)
    private String bio;

    @Column(nullable = false)
    private Boolean verified = false;

    @Column(length = 200)
    private String verificationCode;
}