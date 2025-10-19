package com.carenet.carenet_backend.dto;

/**
 * Request DTO for saving a new card
 * NOTE: In production, use proper tokenization (Stripe, PayPal, etc.)
 */
public class SaveCardRequest {
    private String cardHolder;
    private String cardNumber; // Will be tokenized, never stored
    private String expiryMonth;
    private String expiryYear;
    private String cvv; // Never stored
    private Boolean setAsDefault;

    // Constructors
    public SaveCardRequest() {}

    public SaveCardRequest(String cardHolder, String cardNumber, String expiryMonth, String expiryYear) {
        this.cardHolder = cardHolder;
        this.cardNumber = cardNumber;
        this.expiryMonth = expiryMonth;
        this.expiryYear = expiryYear;
    }

    // Getters and Setters
    public String getCardHolder() {
        return cardHolder;
    }

    public void setCardHolder(String cardHolder) {
        this.cardHolder = cardHolder;
    }

    public String getCardNumber() {
        return cardNumber;
    }

    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
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

    public String getCvv() {
        return cvv;
    }

    public void setCvv(String cvv) {
        this.cvv = cvv;
    }

    public Boolean getSetAsDefault() {
        return setAsDefault;
    }

    public void setSetAsDefault(Boolean setAsDefault) {
        this.setAsDefault = setAsDefault;
    }
}
