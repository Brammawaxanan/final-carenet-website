package com.carenet.carenet_backend.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Entity representing a saved payment card for a client
 * NOTE: Never store raw card numbers - only last 4 digits and secure tokens
 */
@Entity
@Table(name = "client_cards")
public class ClientCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "card_holder", nullable = false, length = 100)
    private String cardHolder;

    @Column(name = "last4", nullable = false, length = 4)
    private String last4; // Last 4 digits only

    @Column(name = "card_token", nullable = false, length = 255)
    private String cardToken; // Tokenized card reference (never raw card number)

    @Column(name = "brand", length = 20)
    private String brand; // VISA, MASTERCARD, AMEX, etc.

    @Column(name = "expiry_month", length = 2)
    private String expiryMonth;

    @Column(name = "expiry_year", length = 4)
    private String expiryYear;

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column(name = "added_at", nullable = false)
    private Instant addedAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // Constructors
    public ClientCard() {
        this.addedAt = Instant.now();
    }

    public ClientCard(Long userId, String cardHolder, String last4, String cardToken, String brand) {
        this.userId = userId;
        this.cardHolder = cardHolder;
        this.last4 = last4;
        this.cardToken = cardToken;
        this.brand = brand;
        this.addedAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCardHolder() {
        return cardHolder;
    }

    public void setCardHolder(String cardHolder) {
        this.cardHolder = cardHolder;
    }

    public String getLast4() {
        return last4;
    }

    public void setLast4(String last4) {
        this.last4 = last4;
    }

    public String getCardToken() {
        return cardToken;
    }

    public void setCardToken(String cardToken) {
        this.cardToken = cardToken;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getExpiryMonth() {
        return expiryMonth;
    }

    public void setExpiryMonth(String expiryMonth) {
        this.expiryMonth = expiryMonth;
    }

    public String getExpiryYear() {
        return expiryYear;
    }

    public void setExpiryYear(String expiryYear) {
        this.expiryYear = expiryYear;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
