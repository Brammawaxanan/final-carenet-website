package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.PaymentLedger;
import com.carenet.carenet_backend.repo.PaymentLedgerRepo;
import com.carenet.carenet_backend.service.PaymentService;
import com.carenet.carenet_backend.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {
    
    private final PaymentService paymentService;
    private final SubscriptionService subscriptionService;
    private final PaymentLedgerRepo ledgerRepo;

    private Long currentUserId() { return 1L; }

    /**
     * MAIN ENDPOINT: Confirm payment and trigger all related operations
     * POST /api/payments/confirm/{bookingId}
     */
    @PostMapping("/confirm/{bookingId}")
    public ResponseEntity<Map<String, Object>> confirmPayment(
            @PathVariable Long bookingId,
            @RequestHeader(name="X-User-Id", required=false) Long userId,
            @RequestBody PaymentConfirmRequest request) {
        
        Long uid = userId != null ? userId : currentUserId();
        
        log.info("Payment confirmation request: bookingId={}, userId={}", bookingId, uid);
        
        Map<String, Object> result = paymentService.confirmPayment(
            bookingId,
            uid,
            request.caregiverId,
            request.serviceType,
            request.packageType,
            request.amount,
            request.paymentMethod
        );
        
        // Handle error responses
        if (result.containsKey("error")) {
            Integer status = (Integer) result.get("status");
            if (status == 409) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(result);
            } else if (status == 422) {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(result);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
            }
        }
        
        return ResponseEntity.ok(result);
    }

    /**
     * Get payment summary for a booking (Activity page display)
     * GET /api/payments/summary?bookingId={bookingId}
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getPaymentSummary(
            @RequestParam Long bookingId,
            @RequestHeader(name="X-User-Id", required=false) Long userId) {
        
        Long uid = userId != null ? userId : currentUserId();
        
        log.info("Fetching payment summary: bookingId={}, userId={}", bookingId, uid);
        
        try {
            Map<String, Object> summary = paymentService.getPaymentSummary(bookingId, uid);
            return ResponseEntity.ok(summary);
            
        } catch (SecurityException e) {
            log.warn("Unauthorized access to payment summary: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "UNAUTHORIZED");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            
        } catch (RuntimeException e) {
            log.error("Payment summary not found: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "NOT_FOUND");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Resend receipt email
     * POST /api/payments/resend-receipt/{paymentId}
     */
    @PostMapping("/resend-receipt/{paymentId}")
    public ResponseEntity<Map<String, Object>> resendReceipt(
            @PathVariable Long paymentId,
            @RequestHeader(name="X-User-Id", required=false) Long userId) {
        
        Long uid = userId != null ? userId : currentUserId();
        
        log.info("Resend receipt request: paymentId={}, userId={}", paymentId, uid);
        
        try {
            Map<String, Object> result = paymentService.resendReceipt(paymentId, uid);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to resend receipt: {}", e.getMessage());
            
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to resend receipt: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get payment history
     * GET /api/payments/history?userId={userId}
     */
    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getPaymentHistory(
            @RequestParam(required = false) Long userId,
            @RequestHeader(name="X-User-Id", required=false) Long headerUserId) {
        
        Long uid = userId != null ? userId : 
                   (headerUserId != null ? headerUserId : currentUserId());
        
        log.info("Fetching payment history for userId={}", uid);
        
        List<Map<String, Object>> payments = paymentService.getPaymentHistory(uid);
        
        Map<String, Object> response = new HashMap<>();
        response.put("payments", payments);
        response.put("count", payments.size());
        response.put("userId", uid);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get upcoming subscription payments
     * GET /api/payments/upcoming?userId={userId}
     */
    @GetMapping("/upcoming")
    public ResponseEntity<Map<String, Object>> getUpcomingPayments(
            @RequestParam(required = false) Long userId,
            @RequestHeader(name="X-User-Id", required=false) Long headerUserId) {
        
        Long uid = userId != null ? userId : 
                   (headerUserId != null ? headerUserId : currentUserId());
        
        log.info("Fetching upcoming payments for userId={}", uid);
        
        List<Map<String, Object>> upcoming = subscriptionService.getUpcomingPayments(uid);
        
        Map<String, Object> response = new HashMap<>();
        response.put("upcomingPayments", upcoming);
        response.put("count", upcoming.size());
        response.put("userId", uid);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Refund a payment
     * POST /api/payments/refund/{paymentId}
     */
    @PostMapping("/refund/{paymentId}")
    public ResponseEntity<Map<String, Object>> refundPayment(
            @PathVariable Long paymentId,
            @RequestBody RefundRequest request) {
        
        log.info("Refund request for paymentId={}", paymentId);
        
        try {
            Map<String, Object> result = paymentService.refundPayment(
                paymentId, 
                request.reason != null ? request.reason : "Requested by user"
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Refund failed: {}", e.getMessage());
            
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Attach a transfer reference or COD contact details to a pending payment
     * POST /api/payments/attach-reference/{paymentId}
     */
    @PostMapping("/attach-reference/{paymentId}")
    public ResponseEntity<Map<String, Object>> attachReference(
            @PathVariable Long paymentId,
            @RequestBody AttachReferenceRequest request) {

        try {
            Map<String, Object> resp = paymentService.attachReference(
                    paymentId,
                    request.transferReference,
                    request.codContactName,
                    request.codContactPhone
            );
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Failed to attach reference: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
    }

    /**
     * Complete a pending bank transfer (admin/webhook)
     * POST /api/payments/complete-transfer/{paymentId}
     */
    @PostMapping("/complete-transfer/{paymentId}")
    public ResponseEntity<Map<String, Object>> completeTransfer(
            @PathVariable Long paymentId,
            @RequestBody CompleteTransferRequest request) {

        try {
            Map<String, Object> resp = paymentService.completeBankTransfer(paymentId, request.transactionReference);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Failed to complete transfer: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
    }

    /**
     * Download receipt PDF by payment ID
     * GET /api/payments/receipt/{paymentId}
     */
    @GetMapping("/receipt/{paymentId}")
    public ResponseEntity<Resource> downloadReceipt(@PathVariable Long paymentId) {
        try {
            log.info("Download receipt request for paymentId={}", paymentId);
            
            PaymentLedger ledger = ledgerRepo.findById(paymentId)
                    .orElseThrow(() -> new RuntimeException("Payment not found"));
            
            if (ledger.getReceiptPath() == null) {
                log.error("Receipt not generated for paymentId={}", paymentId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            File receiptFile = new File(ledger.getReceiptPath());
            if (!receiptFile.exists()) {
                log.error("Receipt file not found: {}", ledger.getReceiptPath());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            Resource resource = new FileSystemResource(receiptFile);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"CareNet_Receipt_" + paymentId + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("Error downloading receipt: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * NEW: Process Credit Card Payment with optional card save
     * POST /api/payments/credit-card/{bookingId}
     */
    @PostMapping("/credit-card/{bookingId}")
    public ResponseEntity<Map<String, Object>> processCreditCardPayment(
            @PathVariable String bookingId,
            @RequestHeader(name="X-User-Id", required=false) Long userId,
            @RequestBody CreditCardPaymentRequest request) {
        
        Long uid = userId != null ? userId : currentUserId();
        
        // Convert bookingId to Long, use null for "subscription"
        Long bookingIdLong = null;
        if (bookingId != null && !bookingId.equalsIgnoreCase("subscription")) {
            try {
                bookingIdLong = Long.parseLong(bookingId);
            } catch (NumberFormatException e) {
                log.error("Invalid bookingId format: {}", bookingId);
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Invalid booking ID format");
                return ResponseEntity.badRequest()
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .body(error);
            }
        }
        
        log.info("Credit card payment: bookingId={}, userId={}, saveCard={}", 
                bookingIdLong, uid, request.saveCard);
        
        try {
            Map<String, Object> result = paymentService.processCreditCardPayment(
                bookingIdLong, uid, request
            );
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(result);
        } catch (IllegalArgumentException e) {
            log.error("Credit card payment validation error: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(error);
        } catch (Exception e) {
            log.error("Credit card payment failed: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Payment processing failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(error);
        }
    }

    /**
     * NEW: Process Bank Transfer Payment
     * POST /api/payments/bank-transfer/{bookingId}
     */
    @PostMapping("/bank-transfer/{bookingId}")
    public ResponseEntity<Map<String, Object>> processBankTransferPayment(
            @PathVariable String bookingId,
            @RequestHeader(name="X-User-Id", required=false) Long userId,
            @RequestBody BankTransferPaymentRequest request) {
        
        Long uid = userId != null ? userId : currentUserId();
        
        // Convert bookingId to Long, use null for "subscription"
        Long bookingIdLong = null;
        if (bookingId != null && !bookingId.equalsIgnoreCase("subscription")) {
            try {
                bookingIdLong = Long.parseLong(bookingId);
            } catch (NumberFormatException e) {
                log.error("Invalid bookingId format: {}", bookingId);
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Invalid booking ID format");
                return ResponseEntity.badRequest()
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .body(error);
            }
        }
        
        log.info("Bank transfer payment: bookingId={}, userId={}, ref={}", 
                bookingIdLong, uid, request.referenceNo);
        
        try {
            Map<String, Object> result = paymentService.processBankTransferPayment(
                bookingIdLong, uid, request
            );
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(result);
        } catch (IllegalArgumentException e) {
            log.error("Bank transfer validation error: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(error);
        } catch (Exception e) {
            log.error("Bank transfer payment failed: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Bank transfer processing failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(error);
        }
    }

    /**
     * NEW: Process Bank Transfer Payment with File Upload
     * POST /api/payments/bank-transfer/{bookingId}/upload
     */
    @PostMapping(value = "/bank-transfer/{bookingId}/upload", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, Object>> processBankTransferPaymentWithFile(
            @PathVariable String bookingId,
            @RequestHeader(name="X-User-Id", required=false) Long userId,
            @RequestParam(required = false) Long caregiverId,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) String packageType,
            @RequestParam Double amount,
            @RequestParam String referenceNo,
            @RequestParam(required = false) String bankName,
            @RequestParam(required = false) String accountHolder,
            @RequestParam(name = "file", required = false) org.springframework.web.multipart.MultipartFile file) {
        
        Long uid = userId != null ? userId : currentUserId();
        
        // Convert bookingId to Long, use null for "subscription"
        Long bookingIdLong = null;
        if (bookingId != null && !bookingId.equalsIgnoreCase("subscription")) {
            try {
                bookingIdLong = Long.parseLong(bookingId);
            } catch (NumberFormatException e) {
                log.error("Invalid bookingId format: {}", bookingId);
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Invalid booking ID format");
                return ResponseEntity.badRequest()
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .body(error);
            }
        }
        
        log.info("Bank transfer payment with file: bookingId={}, userId={}, ref={}, hasFile={}", 
                bookingIdLong, uid, referenceNo, file != null && !file.isEmpty());
        
        try {
            String receiptData = null;
            
            // Convert file to base64 data URL if provided
            if (file != null && !file.isEmpty()) {
                byte[] fileBytes = file.getBytes();
                String base64 = java.util.Base64.getEncoder().encodeToString(fileBytes);
                String contentType = file.getContentType() != null ? file.getContentType() : "application/pdf";
                receiptData = "data:" + contentType + ";base64," + base64;
                log.info("Receipt file converted to base64, length: {}", receiptData.length());
            }
            
            // Create request object
            BankTransferPaymentRequest request = new BankTransferPaymentRequest(
                caregiverId, serviceType, packageType, amount, 
                referenceNo, bankName, accountHolder, receiptData
            );
            
            Map<String, Object> result = paymentService.processBankTransferPayment(
                bookingIdLong, uid, request
            );
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(result);
        } catch (IllegalArgumentException e) {
            log.error("Bank transfer validation error: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(error);
        } catch (Exception e) {
            log.error("Bank transfer payment with file failed: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Bank transfer processing failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(error);
        }
    }

    /**
     * NEW: Process Cash on Delivery Payment
     * POST /api/payments/cod/{bookingId}
     */
    @PostMapping("/cod/{bookingId}")
    public ResponseEntity<Map<String, Object>> processCODPayment(
            @PathVariable String bookingId,
            @RequestHeader(name="X-User-Id", required=false) Long userId,
            @RequestBody CODPaymentRequest request) {
        
        Long uid = userId != null ? userId : currentUserId();
        
        // Convert bookingId to Long, use null for "subscription"
        Long bookingIdLong = null;
        if (bookingId != null && !bookingId.equalsIgnoreCase("subscription")) {
            try {
                bookingIdLong = Long.parseLong(bookingId);
            } catch (NumberFormatException e) {
                log.error("Invalid bookingId format: {}", bookingId);
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Invalid booking ID format");
                return ResponseEntity.badRequest()
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .body(error);
            }
        }
        
        log.info("COD payment: bookingId={}, userId={}, contact={}", 
                bookingIdLong, uid, request.contactPhone);
        
        try {
            Map<String, Object> result = paymentService.processCODPayment(
                bookingIdLong, uid, request
            );
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(result);
        } catch (IllegalArgumentException e) {
            log.error("COD payment validation error: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(error);
        } catch (Exception e) {
            log.error("COD payment failed: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "COD processing failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(error);
        }
    }

    // DTOs - made public for service layer access
    public record PaymentConfirmRequest(
        Long caregiverId,
        String serviceType,
        String packageType,
        Double amount,
        String paymentMethod
    ) {}
    
    public record CreditCardPaymentRequest(
        Long caregiverId,
        String serviceType,
        String packageType,
        Double amount,
        String cardHolder,
        String cardNumber,
        String expiryMonth,
        String expiryYear,
        String cvv,
        Boolean saveCard,
        Long savedCardId
    ) {}
    
    public record BankTransferPaymentRequest(
        Long caregiverId,
        String serviceType,
        String packageType,
        Double amount,
        String referenceNo,
        String bankName,
        String accountHolder,
        String receiptFilePath
    ) {}
    
    public record CODPaymentRequest(
        Long caregiverId,
        String serviceType,
        String packageType,
        Double amount,
        String contactName,
        String contactPhone,
        String notes
    ) {}
    
    public record AttachReferenceRequest(String transferReference, String codContactName, String codContactPhone) {}
    public record CompleteTransferRequest(String transactionReference) {}
    public record RefundRequest(String reason) {}
}
