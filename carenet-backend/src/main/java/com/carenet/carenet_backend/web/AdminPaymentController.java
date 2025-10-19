package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.PaymentLedger;
import com.carenet.carenet_backend.repo.PaymentLedgerRepo;
import com.carenet.carenet_backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin Payment Controller
 * Handles bank transfer verification, approval, and rejection
 */
@RestController
@RequestMapping("/api/admin/payments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminPaymentController {
    
    private static final Logger log = LoggerFactory.getLogger(AdminPaymentController.class);
    
    private final PaymentLedgerRepo ledgerRepo;
    private final PaymentService paymentService;
    
    /**
     * Get all pending bank transfer payments for admin verification
     * GET /api/admin/payments/pending
     */
    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> getPendingBankTransfers(
            @RequestHeader(name="X-User-Id", required=false) Long adminId) {
        
        log.info("Admin {} fetching pending bank transfers", adminId);
        
        try {
            // Find all payments with PENDING_VERIFICATION status
            List<PaymentLedger> pending = ledgerRepo.findAll().stream()
                    .filter(p -> "PENDING_VERIFICATION".equals(p.getStatus()))
                    .filter(p -> "BANK_TRANSFER".equals(p.getPaymentMethod()))
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .collect(Collectors.toList());
            
            // Transform to response format
            List<Map<String, Object>> payments = pending.stream()
                    .map(this::transformPaymentToResponse)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", payments.size());
            response.put("payments", payments);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error fetching pending bank transfers: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch pending payments: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * Get all bank transfer payments (for general admin view)
     * GET /api/admin/payments/bank-transfers
     */
    @GetMapping("/bank-transfers")
    public ResponseEntity<Map<String, Object>> getAllBankTransfers(
            @RequestHeader(name="X-User-Id", required=false) Long adminId,
            @RequestParam(required = false) String status) {
        
        log.info("Admin {} fetching bank transfers, status filter: {}", adminId, status);
        
        try {
            List<PaymentLedger> transfers = ledgerRepo.findAll().stream()
                    .filter(p -> "BANK_TRANSFER".equals(p.getPaymentMethod()))
                    .filter(p -> status == null || status.equals(p.getStatus()))
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .collect(Collectors.toList());
            
            List<Map<String, Object>> payments = transfers.stream()
                    .map(this::transformPaymentToResponse)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", payments.size());
            response.put("payments", payments);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error fetching bank transfers: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch bank transfers: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * Approve a bank transfer payment
     * POST /api/admin/payments/{paymentId}/approve
     */
    @PostMapping("/{paymentId}/approve")
    public ResponseEntity<Map<String, Object>> approvePayment(
            @PathVariable Long paymentId,
            @RequestHeader(name="X-User-Id", required=false) Long adminId,
            @RequestBody(required = false) Map<String, Object> requestBody) {
        
        String adminNote = requestBody != null ? (String) requestBody.get("note") : null;
        log.info("Admin {} approving payment {}", adminId, paymentId);
        
        try {
            Map<String, Object> result = paymentService.approveBankTransferPayment(
                    paymentId, adminId, adminNote
            );
            
            return ResponseEntity.ok(result);
            
        } catch (IllegalArgumentException e) {
            log.error("Validation error approving payment: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
            
        } catch (Exception e) {
            log.error("Error approving payment: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to approve payment: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * Reject a bank transfer payment
     * POST /api/admin/payments/{paymentId}/reject
     */
    @PostMapping("/{paymentId}/reject")
    public ResponseEntity<Map<String, Object>> rejectPayment(
            @PathVariable Long paymentId,
            @RequestHeader(name="X-User-Id", required=false) Long adminId,
            @RequestBody(required = false) Map<String, Object> requestBody) {
        
        String reason = requestBody != null ? (String) requestBody.get("reason") : "Payment verification failed";
        log.info("Admin {} rejecting payment {} with reason: {}", adminId, paymentId, reason);
        
        try {
            Map<String, Object> result = paymentService.rejectBankTransferPayment(
                    paymentId, adminId, reason
            );
            
            return ResponseEntity.ok(result);
            
        } catch (IllegalArgumentException e) {
            log.error("Validation error rejecting payment: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
            
        } catch (Exception e) {
            log.error("Error rejecting payment: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to reject payment: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * Helper method to transform PaymentLedger to response format
     */
    private Map<String, Object> transformPaymentToResponse(PaymentLedger payment) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", payment.getId());
        data.put("userId", payment.getUserId());
        data.put("bookingId", payment.getBookingId());
        data.put("amount", payment.getAmountCents() / 100.0);
        data.put("status", payment.getStatus());
        data.put("paymentMethod", payment.getPaymentMethod());
        data.put("referenceNo", payment.getExternalRef());
        data.put("note", payment.getNote());
        data.put("receiptPath", payment.getReceiptPath());
        data.put("createdAt", payment.getCreatedAt());
        data.put("paidAt", payment.getPaidAt());
        return data;
    }
}
