package com.carenet.carenet_backend.service;

import com.carenet.carenet_backend.domain.*;
import com.carenet.carenet_backend.dto.SaveCardRequest;
import com.carenet.carenet_backend.model.ClientCard;
import com.carenet.carenet_backend.repo.*;
import com.carenet.carenet_backend.web.PaymentController.*;
import com.google.zxing.WriterException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

/**
 * Central payment orchestration service
 * Handles: confirm, ledger write, receipt generation, email sending
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    
    private final PaymentLedgerRepo ledgerRepo;
    private final UserRepo userRepo;
    private final CaregiverRepo caregiverRepo;
    private final AssignmentRepo assignmentRepo;
    private final SubscriptionRepo subscriptionRepo;
    private final ReceiptGeneratorService receiptGenerator;
    private final EmailService emailService;
    private final CardService cardService;
    
    /**
     * Confirm payment and orchestrate all related operations
     * @return Map with payment details
     */
    @Transactional
    public Map<String, Object> confirmPayment(
            Long bookingId,
            Long userId,
            Long caregiverId,
            String serviceType,
            String packageType,
            Double amount,
            String paymentMethod) {
        
        log.info("Starting payment confirmation: bookingId={}, userId={}, amount={}", 
                 bookingId, userId, amount);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 1. Validate booking ownership (in real system, check Booking entity)
            validatePaymentRequest(bookingId, userId, amount);
            
            // 2. Check for duplicate payment
            Optional<PaymentLedger> existingPayment = ledgerRepo.findAll().stream()
                    .filter(l -> l.getBookingId() != null && 
                                 l.getBookingId().equals(bookingId) && 
                                 "completed".equals(l.getStatus()))
                    .findFirst();
            
            if (existingPayment.isPresent()) {
                log.warn("Duplicate payment attempt detected for bookingId={}", bookingId);
                result.put("error", "DUPLICATE_PAYMENT");
                result.put("status", 409);
                result.put("message", "Payment already processed for this booking");
                result.put("existingPaymentId", existingPayment.get().getId());
                return result;
            }
            
            // 3. Get user and caregiver details
            User client = userRepo.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Client not found"));
            Caregiver caregiver = caregiverRepo.findById(caregiverId)
                    .orElseThrow(() -> new RuntimeException("Caregiver not found"));
            
            // 4. Create payment ledger entry and handle by payment method
            PaymentLedger ledger = new PaymentLedger();
            ledger.setUserId(userId);
            ledger.setBookingId(bookingId);
            ledger.setAmountCents((long)(amount * 100));
            ledger.setEntryType(PaymentLedger.EntryType.PAYMENT);
            ledger.setPaymentMethod(paymentMethod);
            ledger.setCreatedAt(Instant.now());
            ledger.setIsRefunded(false);

            String pm = paymentMethod == null ? "" : paymentMethod.trim().toLowerCase();

            // Bank Transfer flow: create pending ledger and return bank instructions
            if (pm.contains("bank") || pm.contains("transfer")) {
                ledger.setStatus("pending");
                // generate a simple external reference for customer to include
                String externalRef = "BT-" + Instant.now().toEpochMilli();
                ledger.setExternalRef(externalRef);

                PaymentLedger savedLedger = ledgerRepo.save(ledger);
                log.info("💤 Bank transfer ledger created [paymentId={}, externalRef={}]",
                        savedLedger.getId(), externalRef);

                Map<String, Object> bankDetails = new HashMap<>();
                bankDetails.put("accountName", "CareNet Services Pvt Ltd");
                bankDetails.put("accountNumber", "123456789012");
                bankDetails.put("bankName", "Mock National Bank");
                bankDetails.put("ifsc", "MNB0001234");
                bankDetails.put("externalRef", externalRef);
                bankDetails.put("instructions", "Please transfer the exact amount and include the reference in the payment note.");

                result.put("success", true);
                result.put("paymentId", savedLedger.getId());
                result.put("bookingId", bookingId);
                result.put("amount", amount);
                result.put("status", "PENDING");
                result.put("paymentMethod", paymentMethod);
                result.put("bankDetails", bankDetails);
                result.put("message", "Bank transfer selected. Follow the instructions to complete payment.");

                return result;
            }

            // Cash on Delivery flow: create pending COD ledger
            if (pm.contains("cod") || pm.contains("cash")) {
                ledger.setStatus("pending_cod");

                PaymentLedger savedLedger = ledgerRepo.save(ledger);
                log.info("💤 COD ledger created [paymentId={}]", savedLedger.getId());

                result.put("success", true);
                result.put("paymentId", savedLedger.getId());
                result.put("bookingId", bookingId);
                result.put("amount", amount);
                result.put("status", "PENDING_COD");
                result.put("paymentMethod", paymentMethod);
                result.put("message", "Cash on Delivery selected. The caregiver will collect payment at service time.");

                return result;
            }

            // Default: treat as immediate/online payment (e.g., Credit Card)
            ledger.setStatus("completed");
            ledger.setPaidAt(Instant.now());

            PaymentLedger savedLedger = ledgerRepo.save(ledger);
            log.info("✅ Ledger write OK [paymentId={}]", savedLedger.getId());

            // 5. Generate PDF receipt
            String receiptPath = null;
            boolean emailQueued = false;

            try {
                receiptPath = receiptGenerator.generateReceipt(
                    bookingId,
                    client.getName(),
                    client.getEmail(),
                    caregiver.getName(),
                    serviceType,
                    packageType,
                    amount,
                    paymentMethod,
                    Instant.now()
                );

                savedLedger.setReceiptPath(receiptPath);
                ledgerRepo.save(savedLedger);

                log.info("✅ Receipt generated [path={}]", receiptPath);

                // 6. Send email asynchronously (non-blocking)
                String subject = "Your CareNet Payment Receipt (Booking #" + bookingId + ")";
                String emailBody = emailService.generateReceiptEmailBody(
                    client.getName(), bookingId, amount);

                emailService.sendEmailWithAttachment(
                    client.getEmail(),
                    subject,
                    emailBody,
                    receiptPath
                );

                emailQueued = true;
                log.info("✅ Email dispatched to {}", client.getEmail());

            } catch (IOException | WriterException e) {
                log.error("❌ Receipt generation failed: {}", e.getMessage(), e);
                // Continue - payment is still successful
            } catch (Exception e) {
                log.error("❌ Email sending failed: {}", e.getMessage(), e);
                // Continue - payment is still successful
            }

            // 7. Build success response
            result.put("success", true);
            result.put("paymentId", savedLedger.getId());
            result.put("bookingId", bookingId);
            result.put("amount", amount);
            result.put("status", "PAID");
            result.put("paidAt", savedLedger.getPaidAt());
            result.put("receiptPath", receiptPath);
            result.put("emailQueued", emailQueued);
            result.put("message", emailQueued ? 
                "Payment successful. Receipt sent to your email." :
                "Payment successful. Receipt download available; email pending.");

            log.info("✅ Payment confirmation complete: paymentId={}", savedLedger.getId());

            return result;
            
        } catch (Exception e) {
            log.error("❌ Payment confirmation failed: bookingId={}, error={}", 
                     bookingId, e.getMessage(), e);
            
            result.put("error", "PAYMENT_FAILED");
            result.put("status", 500);
            result.put("message", "Payment processing failed: " + e.getMessage());
            result.put("traceId", UUID.randomUUID().toString());
            
            return result;
        }
    }
    
    /**
     * Get payment history for user
     */
    public List<Map<String, Object>> getPaymentHistory(Long userId) {
        log.info("Fetching payment history for userId={}", userId);
        
        List<PaymentLedger> ledgers = ledgerRepo.findByUserId(userId);
        
        return ledgers.stream()
                .filter(l -> l.getEntryType() == PaymentLedger.EntryType.PAYMENT)
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(ledger -> {
                    Map<String, Object> payment = new HashMap<>();
                    payment.put("paymentId", ledger.getId());
                    payment.put("bookingId", ledger.getBookingId());
                    payment.put("amount", ledger.getAmountCents() / 100.0);
                    payment.put("method", ledger.getPaymentMethod());
                    payment.put("status", ledger.getStatus());
                    payment.put("paidAt", ledger.getPaidAt());
                    payment.put("receiptPath", ledger.getReceiptPath());
                    payment.put("isRefunded", ledger.getIsRefunded());
                    payment.put("refundedAt", ledger.getRefundedAt());
                    return payment;
                })
                .toList();
    }
    
    /**
     * Refund a payment (stub for now)
     */
    @Transactional
    public Map<String, Object> refundPayment(Long paymentId, String reason) {
        log.info("Processing refund: paymentId={}, reason={}", paymentId, reason);
        
        PaymentLedger ledger = ledgerRepo.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        if (ledger.getIsRefunded()) {
            throw new RuntimeException("Payment already refunded");
        }
        
        ledger.setIsRefunded(true);
        ledger.setRefundedAt(Instant.now());
        ledger.setRefundReason(reason);
        ledger.setStatus("refunded");
        
        ledgerRepo.save(ledger);
        log.info("✅ Refund processed: paymentId={}", paymentId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("paymentId", paymentId);
        result.put("refundedAt", ledger.getRefundedAt());
        result.put("message", "Refund processed successfully");
        
        return result;
    }
    
    /**
     * Get payment summary for a booking (used by Activity page)
     * Returns consolidated payment status, receipt info, and subscription details
     */
    public Map<String, Object> getPaymentSummary(Long bookingId, Long userId) {
        log.info("Fetching payment summary: bookingId={}, userId={}", bookingId, userId);
        
        // 1. Find assignment to verify access
        List<Assignment> assignments = assignmentRepo.findByBookingId(bookingId);
        if (assignments.isEmpty()) {
            throw new RuntimeException("Booking not found: " + bookingId);
        }
        
        Assignment assignment = assignments.get(0);
        
        // 2. Verify user is authorized (must be client OR caregiver)
        boolean isClient = assignment.getClientId().equals(userId);
        boolean isCaregiver = assignment.getCaregiverId().equals(userId);
        
        if (!isClient && !isCaregiver) {
            throw new SecurityException("Unauthorized access to booking " + bookingId);
        }
        
        // 3. Find payment ledger entry
        Optional<PaymentLedger> paymentOpt = ledgerRepo.findAll().stream()
                .filter(l -> l.getBookingId() != null && 
                           l.getBookingId().equals(bookingId) &&
                           l.getEntryType() == PaymentLedger.EntryType.PAYMENT)
                .findFirst();
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("bookingId", bookingId);
        
        if (paymentOpt.isPresent()) {
            // Payment exists
            PaymentLedger payment = paymentOpt.get();
            
            summary.put("status", payment.getIsRefunded() ? "REFUNDED" : 
                       "completed".equals(payment.getStatus()) ? "PAID" : "PENDING");
            summary.put("amount", payment.getAmountCents() / 100.0);
            summary.put("method", payment.getPaymentMethod());
            summary.put("paidAt", payment.getPaidAt());
            summary.put("receiptPath", payment.getReceiptPath());
            summary.put("paymentId", payment.getId());
            summary.put("isRefunded", payment.getIsRefunded());
            
            // Check if email was successfully sent (receiptPath exists means it was attempted)
            summary.put("emailQueued", payment.getReceiptPath() != null);
            
        } else {
            // No payment yet
            summary.put("status", "PENDING");
            summary.put("amount", null);
            summary.put("method", null);
            summary.put("paidAt", null);
            summary.put("receiptPath", null);
            summary.put("paymentId", null);
            summary.put("emailQueued", false);
        }
        
        // 4. Check for active subscription
        List<Subscription> subscriptions = subscriptionRepo.findByUserId(userId);
        Optional<Subscription> activeSub = subscriptions.stream()
                .filter(s -> s.getActive() && "ACTIVE".equals(s.getStatus()))
                .findFirst();
        
        if (activeSub.isPresent()) {
            summary.put("hasSubscription", true);
            summary.put("nextBilling", activeSub.get().getNextBillingAt());
            summary.put("subscriptionTier", activeSub.get().getTier());
        } else {
            summary.put("hasSubscription", false);
            summary.put("nextBilling", null);
        }
        
        // 5. Add role for frontend display logic
        summary.put("viewerRole", isClient ? "CLIENT" : "CAREGIVER");
        
        log.info("✅ Payment summary retrieved: bookingId={}, status={}", 
                bookingId, summary.get("status"));
        
        return summary;
    }
    
    /**
     * Resend receipt email for a payment
     * Used when initial email failed or user requests resend
     */
    @Transactional
    public Map<String, Object> resendReceipt(Long paymentId, Long userId) {
        log.info("Resending receipt: paymentId={}, userId={}", paymentId, userId);
        
        // 1. Find payment
        PaymentLedger payment = ledgerRepo.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
        
        // 2. Verify ownership
        if (!payment.getUserId().equals(userId)) {
            throw new SecurityException("Unauthorized access to payment " + paymentId);
        }
        
        // 3. Verify receipt exists
        if (payment.getReceiptPath() == null) {
            throw new RuntimeException("Receipt not generated for payment " + paymentId);
        }
        
        // 4. Get user details
        User client = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 5. Resend email async
            String subject = "[RESEND] Your CareNet Payment Receipt (Booking #" + 
                           payment.getBookingId() + ")";
            String emailBody = emailService.generateReceiptEmailBody(
                client.getName(), 
                payment.getBookingId(), 
                payment.getAmountCents() / 100.0
            );
            
            emailService.sendEmailWithAttachment(
                client.getEmail(),
                subject,
                emailBody,
                payment.getReceiptPath()
            );
            
            result.put("success", true);
            result.put("message", "Receipt email resent successfully");
            result.put("emailSentTo", client.getEmail());
            
            log.info("✅ Receipt resent: paymentId={}, to={}", paymentId, client.getEmail());
            
        } catch (Exception e) {
            log.error("❌ Failed to resend receipt: {}", e.getMessage(), e);
            
            result.put("success", false);
            result.put("message", "Failed to resend email: " + e.getMessage());
        }
        
        return result;
    }

    /**
     * Attach a user-provided transfer reference or COD contact info to an existing ledger entry.
     */
    @Transactional
    public Map<String, Object> attachReference(Long paymentId, String transferReference, String codContactName, String codContactPhone) {
        log.info("Attaching reference to paymentId={} ref={}", paymentId, transferReference);

        PaymentLedger ledger = ledgerRepo.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (transferReference != null && !transferReference.isBlank()) {
            // store user-provided reference in externalRef for quicker lookup
            ledger.setExternalRef(transferReference.trim());
        }

        if ((codContactName != null && !codContactName.isBlank()) || (codContactPhone != null && !codContactPhone.isBlank())) {
            StringBuilder note = new StringBuilder();
            if (codContactName != null && !codContactName.isBlank()) note.append("COD Contact: ").append(codContactName.trim()).append(". ");
            if (codContactPhone != null && !codContactPhone.isBlank()) note.append("Phone: ").append(codContactPhone.trim()).append(".");
            ledger.setNote((ledger.getNote() == null ? "" : ledger.getNote() + " ") + note.toString());
        }

        ledgerRepo.save(ledger);

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("paymentId", ledger.getId());
        resp.put("message", "Reference attached successfully");
        return resp;
    }

    /**
     * Complete a pending bank transfer (admin or webhook). Generates receipt and emails user.
     */
    @Transactional
    public Map<String, Object> completeBankTransfer(Long paymentId, String transactionReference) {
        log.info("Completing bank transfer for paymentId={} txRef={}", paymentId, transactionReference);

        PaymentLedger ledger = ledgerRepo.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (!"pending".equals(ledger.getStatus()) && !"pending_cod".equals(ledger.getStatus())) {
            throw new RuntimeException("Payment is not pending and cannot be completed: status=" + ledger.getStatus());
        }

        ledger.setStatus("completed");
        ledger.setPaidAt(Instant.now());
        if (transactionReference != null && !transactionReference.isBlank()) ledger.setExternalRef(transactionReference.trim());
        ledgerRepo.save(ledger);

        // Attempt receipt generation + email similar to confirmPayment
        String receiptPath = null;
        boolean emailQueued = false;
        try {
            // load user and caregiver to generate receipt; ignore failures
            User client = userRepo.findById(ledger.getUserId()).orElse(null);
            Caregiver caregiver = null;
            if (ledger.getBookingId() != null) {
                // best-effort: find caregiver via assignment if present
                List<Assignment> assignments = assignmentRepo.findByBookingId(ledger.getBookingId());
                if (!assignments.isEmpty()) caregiver = caregiverRepo.findById(assignments.get(0).getCaregiverId()).orElse(null);
            }

            receiptPath = receiptGenerator.generateReceipt(
                    ledger.getBookingId(),
                    client != null ? client.getName() : "Client",
                    client != null ? client.getEmail() : "",
                    caregiver != null ? caregiver.getName() : "Caregiver",
                    null,
                    null,
                    ledger.getAmountCents() / 100.0,
                    ledger.getPaymentMethod(),
                    Instant.now()
            );

            ledger.setReceiptPath(receiptPath);
            ledgerRepo.save(ledger);

            if (client != null && client.getEmail() != null && !client.getEmail().isBlank()) {
                String subject = "Your CareNet Payment Receipt (Booking #" + ledger.getBookingId() + ")";
                String emailBody = emailService.generateReceiptEmailBody(
                        client.getName(), ledger.getBookingId(), ledger.getAmountCents() / 100.0);

                emailService.sendEmailWithAttachment(
                        client.getEmail(), subject, emailBody, receiptPath);
                emailQueued = true;
            }

        } catch (Exception e) {
            log.error("Failed to generate receipt/email when completing transfer: {}", e.getMessage(), e);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("paymentId", ledger.getId());
        resp.put("bookingId", ledger.getBookingId());
        resp.put("amount", ledger.getAmountCents() / 100.0);
        resp.put("status", "PAID");
        resp.put("receiptPath", receiptPath);
        resp.put("emailQueued", emailQueued);
        resp.put("message", emailQueued ? "Payment marked completed and receipt emailed." : "Payment marked completed.");

        return resp;
    }
    
    /**
     * Validate payment request
     * Note: bookingId can be null for subscription payments
     */
    private void validatePaymentRequest(Long bookingId, Long userId, Double amount) {
        // bookingId can be null for subscription payments
        if (bookingId != null && bookingId <= 0) {
            throw new IllegalArgumentException("Invalid booking ID");
        }
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("Invalid user ID");
        }
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Invalid amount");
        }
        
        // In real system, verify booking exists and belongs to user
        // Also verify amount matches booking amount
    }

    /**
     * NEW: Process Credit Card Payment with optional card save
     */
    @Transactional
    public Map<String, Object> processCreditCardPayment(
            Long bookingId,
            Long userId,
            CreditCardPaymentRequest request) {
        
        log.info("Processing credit card payment: bookingId={}, userId={}, saveCard={}", 
                bookingId, userId, request.saveCard());
        
        validatePaymentRequest(bookingId, userId, request.amount());
        
        try {
            // 1. Save card if requested (before payment processing)
            ClientCard savedCard = null;
            if (Boolean.TRUE.equals(request.saveCard()) && request.cardNumber() != null) {
                SaveCardRequest saveRequest = new SaveCardRequest();
                saveRequest.setCardHolder(request.cardHolder());
                saveRequest.setCardNumber(request.cardNumber());
                saveRequest.setExpiryMonth(request.expiryMonth());
                saveRequest.setExpiryYear(request.expiryYear());
                saveRequest.setCvv(request.cvv());
                saveRequest.setSetAsDefault(false);
                
                savedCard = cardService.saveCard(userId, saveRequest);
                log.info("Card saved successfully: cardId={}, last4={}", 
                        savedCard.getId(), savedCard.getLast4());
            }
            
            // 2. Process payment using existing confirmPayment method
            Map<String, Object> paymentResult = confirmPayment(
                bookingId,
                userId,
                request.caregiverId(),
                request.serviceType(),
                request.packageType(),
                request.amount(),
                "CREDIT_CARD"
            );
            
            // 3. Add saved card info to response
            if (savedCard != null) {
                paymentResult.put("cardSaved", true);
                paymentResult.put("savedCardId", savedCard.getId());
                paymentResult.put("cardLast4", savedCard.getLast4());
                paymentResult.put("cardBrand", savedCard.getBrand());
            }
            
            return paymentResult;
            
        } catch (Exception e) {
            log.error("Credit card payment failed: {}", e.getMessage(), e);
            throw new RuntimeException("Payment processing failed: " + e.getMessage());
        }
    }

    /**
     * NEW: Process Bank Transfer Payment
     * Creates payment record with PENDING_VERIFICATION status
     */
    @Transactional
    public Map<String, Object> processBankTransferPayment(
            Long bookingId,
            Long userId,
            BankTransferPaymentRequest request) {
        
        log.info("Processing bank transfer payment: bookingId={}, userId={}, ref={}", 
                bookingId, userId, request.referenceNo());
        
        validatePaymentRequest(bookingId, userId, request.amount());
        
        try {
            // Find or create user
            User user = userRepo.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Create payment ledger with PENDING_VERIFICATION status
            PaymentLedger ledger = new PaymentLedger();
            ledger.setUserId(userId);
            ledger.setBookingId(bookingId);
            ledger.setEntryType(PaymentLedger.EntryType.PAYMENT);
            
            // Convert amount to cents (PaymentLedger uses amountCents as Long)
            ledger.setAmountCents((long) (request.amount() * 100));
            
            ledger.setStatus("PENDING_VERIFICATION"); // Admin needs to verify
            ledger.setPaymentMethod("BANK_TRANSFER");
            ledger.setExternalRef(request.referenceNo()); // Use externalRef for reference number
            ledger.setCreatedAt(Instant.now());
            
            // Store all details in note field (JSON format)
            String noteContent = String.format(
                "Bank Transfer | CaregiverId: %s | Service: %s | Package: %s | Bank: %s | Account Holder: %s | Reference: %s",
                request.caregiverId() != null ? request.caregiverId() : "N/A",
                request.serviceType() != null ? request.serviceType() : "N/A",
                request.packageType() != null ? request.packageType() : "N/A",
                request.bankName() != null ? request.bankName() : "N/A",
                request.accountHolder() != null ? request.accountHolder() : "N/A",
                request.referenceNo() != null ? request.referenceNo() : "N/A"
            );
            ledger.setNote(noteContent);
            
            // Save receipt file path if uploaded
            if (request.receiptFilePath() != null) {
                ledger.setReceiptPath(request.receiptFilePath());
            }
            
            PaymentLedger saved = ledgerRepo.save(ledger);
            log.info("Bank transfer payment created with PENDING status: paymentId={}", saved.getId());
            
            // Send notification email to user (check if sendSimpleEmail method exists)
            try {
                String emailBody = String.format(
                    "Dear %s,\n\nWe have received your bank transfer payment.\n\n" +
                    "Amount: Rs %.2f\n" +
                    "Reference: %s\n\n" +
                    "Your payment is currently being verified by our team. " +
                    "You will receive a confirmation email once verified.\n\n" +
                    "Thank you for using CareNet!",
                    user.getName(), request.amount(), request.referenceNo()
                );
                emailService.sendSimpleEmail(user.getEmail(), "Bank Transfer Received - Pending Verification", emailBody);
            } catch (Exception e) {
                log.error("Failed to send bank transfer notification: {}", e.getMessage());
            }
            
            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("paymentId", saved.getId());
            response.put("status", "PENDING_VERIFICATION");
            response.put("message", "Bank transfer received. Payment will be verified by admin.");
            response.put("bookingId", bookingId);
            response.put("amount", request.amount());
            response.put("referenceNo", request.referenceNo());
            
            return response;
            
        } catch (Exception e) {
            log.error("Bank transfer payment failed: {}", e.getMessage(), e);
            throw new RuntimeException("Bank transfer processing failed: " + e.getMessage());
        }
    }

    /**
     * NEW: Process Cash on Delivery Payment
     * Creates payment record with PENDING status (to be collected)
     */
    @Transactional
    public Map<String, Object> processCODPayment(
            Long bookingId,
            Long userId,
            CODPaymentRequest request) {
        
        log.info("Processing COD payment: bookingId={}, userId={}, contact={}", 
                bookingId, userId, request.contactPhone());
        
        validatePaymentRequest(bookingId, userId, request.amount());
        
        try {
            // Find or create user
            User user = userRepo.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Create payment ledger with PENDING status
            PaymentLedger ledger = new PaymentLedger();
            ledger.setUserId(userId);
            ledger.setBookingId(bookingId);
            ledger.setEntryType(PaymentLedger.EntryType.PAYMENT);
            
            // Convert amount to cents (PaymentLedger uses amountCents as Long)
            ledger.setAmountCents((long) (request.amount() * 100));
            
            ledger.setStatus("PENDING"); // To be collected
            ledger.setPaymentMethod("CASH_ON_DELIVERY");
            ledger.setCreatedAt(Instant.now());
            
            // Store COD details in note field
            String noteContent = String.format(
                "COD | CaregiverId: %s | Service: %s | Package: %s | Contact: %s | Phone: %s | Notes: %s",
                request.caregiverId() != null ? request.caregiverId() : "N/A",
                request.serviceType() != null ? request.serviceType() : "N/A",
                request.packageType() != null ? request.packageType() : "N/A",
                request.contactName() != null ? request.contactName() : user.getName(),
                request.contactPhone() != null ? request.contactPhone() : "N/A",
                request.notes() != null ? request.notes() : "N/A"
            );
            ledger.setNote(noteContent);
            
            PaymentLedger saved = ledgerRepo.save(ledger);
            log.info("COD payment created with PENDING status: paymentId={}", saved.getId());
            
            // Send confirmation email to user
            try {
                String emailBody = String.format(
                    "Dear %s,\n\nYour booking has been confirmed with Cash on Delivery payment.\n\n" +
                    "Amount to be collected: Rs %.2f\n" +
                    "Service Type: %s\n\n" +
                    "Please keep the exact amount ready for the caregiver.\n\n" +
                    "Thank you for using CareNet!",
                    user.getName(), request.amount(), request.serviceType()
                );
                emailService.sendSimpleEmail(user.getEmail(), "Cash on Delivery Booking Confirmed", emailBody);
            } catch (Exception e) {
                log.error("Failed to send COD confirmation: {}", e.getMessage());
            }
            
            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("paymentId", saved.getId());
            response.put("status", "PENDING");
            response.put("message", "COD booking confirmed. Payment will be collected upon service.");
            response.put("bookingId", bookingId);
            response.put("amount", request.amount());
            response.put("paymentMethod", "CASH_ON_DELIVERY");
            
            return response;
            
        } catch (Exception e) {
            log.error("COD payment failed: {}", e.getMessage(), e);
            throw new RuntimeException("COD processing failed: " + e.getMessage());
        }
    }
    
    /**
     * Approve bank transfer payment (Admin action)
     * - Updates status to VERIFIED
     * - Generates PDF receipt
     * - Sends emails to client and caregiver
     */
    @Transactional
    public Map<String, Object> approveBankTransferPayment(
            Long paymentId, 
            Long adminId, 
            String adminNote) {
        
        log.info("Admin {} approving payment {}", adminId, paymentId);
        
        // 1. Find and validate payment
        PaymentLedger payment = ledgerRepo.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        
        if (!"PENDING_VERIFICATION".equals(payment.getStatus())) {
            throw new IllegalArgumentException("Payment is not pending verification. Current status: " + payment.getStatus());
        }
        
        if (!"BANK_TRANSFER".equals(payment.getPaymentMethod())) {
            throw new IllegalArgumentException("Only bank transfer payments can be verified");
        }
        
        try {
            // 2. Get user details
            User client = userRepo.findById(payment.getUserId())
                    .orElseThrow(() -> new RuntimeException("Client not found"));
            
            // 3. Extract caregiver info from note field
            String noteContent = payment.getNote();
            Long caregiverId = extractCaregiverIdFromNote(noteContent);
            String serviceType = extractValueFromNote(noteContent, "Service");
            String packageType = extractValueFromNote(noteContent, "Package");
            
            // Get caregiver details
            Caregiver caregiver = null;
            String caregiverName = "N/A";
            String caregiverEmail = null;
            
            if (caregiverId != null) {
                caregiver = caregiverRepo.findById(caregiverId).orElse(null);
                if (caregiver != null) {
                    caregiverName = caregiver.getName();
                    // Get caregiver user email
                    User caregiverUser = userRepo.findById(caregiver.getUserId()).orElse(null);
                    if (caregiverUser != null) {
                        caregiverEmail = caregiverUser.getEmail();
                    }
                }
            }
            
            // 4. Update payment status
            payment.setStatus("VERIFIED");
            payment.setPaidAt(Instant.now());
            
            // Add admin verification note
            String updatedNote = noteContent + " | Verified by Admin ID: " + adminId;
            if (adminNote != null && !adminNote.isEmpty()) {
                updatedNote += " | Admin Note: " + adminNote;
            }
            payment.setNote(updatedNote);
            
            // 5. Generate PDF receipt
            double amount = payment.getAmountCents() / 100.0;
            String receiptPath = null;
            
            try {
                receiptPath = receiptGenerator.generateReceipt(
                        payment.getId(),
                        client.getName(),
                        client.getEmail(),
                        caregiverName,
                        serviceType != null ? serviceType : "Service",
                        packageType != null ? packageType : "Standard",
                        amount,
                        "Bank Transfer (Verified)",
                        payment.getPaidAt()
                );
                
                // Store PDF path (not base64)
                payment.setReceiptPath(receiptPath);
                log.info("Receipt PDF generated: {}", receiptPath);
                
            } catch (IOException | WriterException e) {
                log.error("Failed to generate receipt PDF: {}", e.getMessage(), e);
                // Continue without PDF
            }
            
            // 6. Save updated payment
            PaymentLedger savedPayment = ledgerRepo.save(payment);
            log.info("Payment {} marked as VERIFIED", paymentId);
            
            // 7. Send email to client
            try {
                String clientEmailBody = String.format(
                    """
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0;">Payment Verified ✓</h1>
                            </div>
                            
                            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                                <p>Dear <strong>%s</strong>,</p>
                                
                                <p>Great news! Your bank transfer payment has been <strong style="color: #10b981;">verified and approved</strong> by our admin team.</p>
                                
                                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                                    <h3 style="margin: 0 0 10px 0; color: #059669;">Payment Details</h3>
                                    <table style="width: 100%%;">
                                        <tr>
                                            <td style="padding: 8px 0;"><strong>Payment ID:</strong></td>
                                            <td style="padding: 8px 0; text-align: right;">#%d</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0;"><strong>Amount:</strong></td>
                                            <td style="padding: 8px 0; text-align: right; color: #10b981; font-size: 18px; font-weight: bold;">Rs. %.2f</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0;"><strong>Reference No:</strong></td>
                                            <td style="padding: 8px 0; text-align: right;">%s</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0;"><strong>Caregiver:</strong></td>
                                            <td style="padding: 8px 0; text-align: right;">%s</td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <p>Your payment receipt is attached to this email as a PDF.</p>
                                
                                <p style="margin-top: 30px;">Thank you for choosing CareNet!</p>
                                
                                <p style="margin-top: 30px;">
                                    Best regards,<br>
                                    <strong>The CareNet Team</strong>
                                </p>
                            </div>
                            
                            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                                <p>© 2025 CareNet. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """,
                    client.getName(),
                    payment.getId(),
                    amount,
                    payment.getExternalRef(),
                    caregiverName
                );
                
                emailService.sendEmailWithAttachment(
                        client.getEmail(),
                        "Payment Verified - CareNet",
                        clientEmailBody,
                        receiptPath
                );
                log.info("Verification email sent to client: {}", client.getEmail());
                
            } catch (Exception e) {
                log.error("Failed to send verification email to client: {}", e.getMessage());
            }
            
            // 8. Send email to caregiver (if exists)
            if (caregiverEmail != null && !caregiverEmail.isEmpty()) {
                try {
                    String caregiverEmailBody = String.format(
                        """
                        <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                    <h1 style="color: white; margin: 0;">Payment Received</h1>
                                </div>
                                
                                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                                    <p>Dear <strong>%s</strong>,</p>
                                    
                                    <p>You have received a <strong style="color: #10b981;">verified payment</strong> from <strong>%s</strong>.</p>
                                    
                                    <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                        <h3 style="margin: 0 0 10px 0; color: #667eea;">Payment Details</h3>
                                        <table style="width: 100%%;">
                                            <tr>
                                                <td style="padding: 8px 0;"><strong>Payment ID:</strong></td>
                                                <td style="padding: 8px 0; text-align: right;">#%d</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;"><strong>Amount:</strong></td>
                                                <td style="padding: 8px 0; text-align: right; color: #10b981; font-size: 18px; font-weight: bold;">Rs. %.2f</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;"><strong>Service:</strong></td>
                                                <td style="padding: 8px 0; text-align: right;">%s</td>
                                            </tr>
                                        </table>
                                    </div>
                                    
                                    <p>The payment receipt is attached to this email.</p>
                                    
                                    <p style="margin-top: 30px;">
                                        Best regards,<br>
                                        <strong>The CareNet Team</strong>
                                    </p>
                                </div>
                            </div>
                        </body>
                        </html>
                        """,
                        caregiverName,
                        client.getName(),
                        payment.getId(),
                        amount,
                        serviceType != null ? serviceType : "Service"
                    );
                    
                    emailService.sendEmailWithAttachment(
                            caregiverEmail,
                            "Payment Received from " + client.getName(),
                            caregiverEmailBody,
                            receiptPath
                    );
                    log.info("Payment notification sent to caregiver: {}", caregiverEmail);
                    
                } catch (Exception e) {
                    log.error("Failed to send email to caregiver: {}", e.getMessage());
                }
            }
            
            // 9. Build response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment approved and verified successfully");
            response.put("paymentId", savedPayment.getId());
            response.put("status", savedPayment.getStatus());
            response.put("receiptPath", receiptPath);
            response.put("emailsSent", true);
            
            return response;
            
        } catch (Exception e) {
            log.error("Failed to approve payment: {}", e.getMessage(), e);
            throw new RuntimeException("Payment approval failed: " + e.getMessage());
        }
    }
    
    /**
     * Reject bank transfer payment (Admin action)
     * - Updates status to REJECTED
     * - Sends rejection email to client
     */
    @Transactional
    public Map<String, Object> rejectBankTransferPayment(
            Long paymentId, 
            Long adminId, 
            String reason) {
        
        log.info("Admin {} rejecting payment {}, reason: {}", adminId, paymentId, reason);
        
        // 1. Find and validate payment
        PaymentLedger payment = ledgerRepo.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        
        if (!"PENDING_VERIFICATION".equals(payment.getStatus())) {
            throw new IllegalArgumentException("Payment is not pending verification. Current status: " + payment.getStatus());
        }
        
        try {
            // 2. Get user details
            User client = userRepo.findById(payment.getUserId())
                    .orElseThrow(() -> new RuntimeException("Client not found"));
            
            // 3. Update payment status
            payment.setStatus("REJECTED");
            String updatedNote = payment.getNote() + " | Rejected by Admin ID: " + adminId + " | Reason: " + reason;
            payment.setNote(updatedNote);
            
            PaymentLedger savedPayment = ledgerRepo.save(payment);
            log.info("Payment {} marked as REJECTED", paymentId);
            
            // 4. Send rejection email to client
            try {
                double amount = payment.getAmountCents() / 100.0;
                
                String emailBody = String.format(
                    """
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0;">Payment Verification Failed</h1>
                            </div>
                            
                            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                                <p>Dear <strong>%s</strong>,</p>
                                
                                <p>We regret to inform you that your bank transfer payment could not be verified.</p>
                                
                                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                                    <h3 style="margin: 0 0 10px 0; color: #dc2626;">Payment Details</h3>
                                    <table style="width: 100%%;">
                                        <tr>
                                            <td style="padding: 8px 0;"><strong>Payment ID:</strong></td>
                                            <td style="padding: 8px 0; text-align: right;">#%d</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0;"><strong>Amount:</strong></td>
                                            <td style="padding: 8px 0; text-align: right;">Rs. %.2f</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0;"><strong>Reference No:</strong></td>
                                            <td style="padding: 8px 0; text-align: right;">%s</td>
                                        </tr>
                                    </table>
                                    
                                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fca5a5;">
                                        <p style="margin: 0;"><strong>Reason:</strong></p>
                                        <p style="margin: 5px 0 0 0; color: #dc2626;">%s</p>
                                    </div>
                                </div>
                                
                                <p><strong>What to do next:</strong></p>
                                <ul>
                                    <li>Please verify your bank transfer details</li>
                                    <li>Re-upload a clear copy of your payment receipt</li>
                                    <li>Contact our support team if you need assistance</li>
                                </ul>
                                
                                <p style="margin-top: 30px;">We apologize for any inconvenience.</p>
                                
                                <p style="margin-top: 30px;">
                                    Best regards,<br>
                                    <strong>The CareNet Support Team</strong><br>
                                    <a href="mailto:support@carenet.com">support@carenet.com</a>
                                </p>
                            </div>
                            
                            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                                <p>© 2025 CareNet. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """,
                    client.getName(),
                    payment.getId(),
                    amount,
                    payment.getExternalRef(),
                    reason
                );
                
                emailService.sendSimpleEmail(
                        client.getEmail(),
                        "Bank Transfer Verification Failed - CareNet",
                        emailBody
                );
                log.info("Rejection email sent to client: {}", client.getEmail());
                
            } catch (Exception e) {
                log.error("Failed to send rejection email: {}", e.getMessage());
            }
            
            // 5. Build response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment rejected successfully");
            response.put("paymentId", savedPayment.getId());
            response.put("status", savedPayment.getStatus());
            response.put("reason", reason);
            
            return response;
            
        } catch (Exception e) {
            log.error("Failed to reject payment: {}", e.getMessage(), e);
            throw new RuntimeException("Payment rejection failed: " + e.getMessage());
        }
    }
    
    /**
     * Helper: Extract caregiver ID from note field
     */
    private Long extractCaregiverIdFromNote(String note) {
        if (note == null) return null;
        try {
            String[] parts = note.split("\\|");
            for (String part : parts) {
                if (part.trim().startsWith("CaregiverId:")) {
                    String value = part.split(":")[1].trim();
                    if (!"N/A".equals(value)) {
                        return Long.parseLong(value);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract caregiver ID from note: {}", e.getMessage());
        }
        return null;
    }
    
    /**
     * Helper: Extract value from note field
     */
    private String extractValueFromNote(String note, String key) {
        if (note == null) return null;
        try {
            String[] parts = note.split("\\|");
            for (String part : parts) {
                if (part.trim().startsWith(key + ":")) {
                    String value = part.split(":")[1].trim();
                    return "N/A".equals(value) ? null : value;
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract {} from note: {}", key, e.getMessage());
        }
        return null;
    }
}
