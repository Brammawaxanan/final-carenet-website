package com.carenet.carenet_backend.dto;

/**
 * Generic payment request DTO for all payment methods
 */
public class PaymentRequest {
    
    // Common fields
    private String paymentMethod; // CREDIT_CARD, BANK_TRANSFER, CASH_ON_DELIVERY
    private Double amount;
    private Long bookingId;
    private Long userId;
    
    // Credit Card fields
    private String cardToken; // For saved cards
    private String cardHolder;
    private String cardNumber;
    private String expiryMonth;
    private String expiryYear;
    private String cvv;
    private Boolean saveCard;
    
    // Bank Transfer fields
    private String bankReferenceNo;
    private String bankName;
    private String accountHolder;
    private String receiptFilePath;
    
    // COD fields
    private String codContactName;
    private String codContactPhone;
    private String codNotes;

    // Constructors
    public PaymentRequest() {}

    // Getters and Setters
    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCardToken() {
        return cardToken;
    }

    public void setCardToken(String cardToken) {
        this.cardToken = cardToken;
    }

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

    public Boolean getSaveCard() {
        return saveCard;
    }

    public void setSaveCard(Boolean saveCard) {
        this.saveCard = saveCard;
    }

    public String getBankReferenceNo() {
        return bankReferenceNo;
    }

    public void setBankReferenceNo(String bankReferenceNo) {
        this.bankReferenceNo = bankReferenceNo;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getAccountHolder() {
        return accountHolder;
    }

    public void setAccountHolder(String accountHolder) {
        this.accountHolder = accountHolder;
    }

    public String getReceiptFilePath() {
        return receiptFilePath;
    }

    public void setReceiptFilePath(String receiptFilePath) {
        this.receiptFilePath = receiptFilePath;
    }

    public String getCodContactName() {
        return codContactName;
    }

    public void setCodContactName(String codContactName) {
        this.codContactName = codContactName;
    }

    public String getCodContactPhone() {
        return codContactPhone;
    }

    public void setCodContactPhone(String codContactPhone) {
        this.codContactPhone = codContactPhone;
    }

    public String getCodNotes() {
        return codNotes;
    }

    public void setCodNotes(String codNotes) {
        this.codNotes = codNotes;
    }
}
