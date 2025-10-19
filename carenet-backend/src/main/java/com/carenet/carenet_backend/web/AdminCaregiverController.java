package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.Caregiver;
import com.carenet.carenet_backend.domain.CaregiverDocument;
import com.carenet.carenet_backend.domain.User;
import com.carenet.carenet_backend.repo.CaregiverDocumentRepo;
import com.carenet.carenet_backend.repo.CaregiverRepo;
import com.carenet.carenet_backend.repo.UserRepo;
import com.carenet.carenet_backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/caregivers")
@RequiredArgsConstructor
public class AdminCaregiverController {
    private final CaregiverRepo caregiverRepo;
    private final CaregiverDocumentRepo documentRepo;
    private final UserRepo userRepo;
    private final EmailService emailService;

    // Note: caregiver listing is provided by the existing AdminController to avoid duplicate mappings.

    @GetMapping("/{caregiverId}/documents")
    public List<Map<String, Object>> getDocuments(@PathVariable Long caregiverId) {
        return documentRepo.findByCaregiverId(caregiverId).stream().map(d -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", d.getId());
            m.put("fileName", d.getFileName());
            m.put("category", d.getCategory());
            m.put("uploadedAt", d.getUploadedAt());
            m.put("approved", d.getApproved());
            m.put("approvedBy", d.getApprovedBy());
            m.put("approvedAt", d.getApprovedAt());
            m.put("fileUrl", d.getFileUrl());
            return m;
        }).collect(Collectors.toList());
    }

    @PutMapping("/documents/{documentId}/approve")
    public Map<String, Object> approveDocument(@PathVariable Long documentId, @RequestBody Map<String, String> body) {
        String adminName = body.getOrDefault("adminName", "Admin");
        CaregiverDocument doc = documentRepo.findById(documentId).orElseThrow();
        doc.setApproved(true);
        doc.setApprovedBy(adminName);
        doc.setApprovedAt(Instant.now());
        documentRepo.save(doc);

        // If all docs approved -> mark caregiver verified and send email with QR
        Long cgId = doc.getCaregiverId();
        List<CaregiverDocument> docs = documentRepo.findByCaregiverId(cgId);
        boolean allApproved = docs.stream().allMatch(d -> Boolean.TRUE.equals(d.getApproved()));
        Map<String, Object> resp = new HashMap<>();
        resp.put("documentId", doc.getId());
        resp.put("approved", true);

        if (allApproved) {
            Caregiver cg = caregiverRepo.findById(cgId).orElseThrow();
            cg.setVerified(true);
            // generate a simple verification code
            String code = UUID.randomUUID().toString();
            cg.setVerificationCode(code);
            caregiverRepo.save(cg);

            // Diagnostic log - help debugging why dashboard may not show QR
            try {
                System.out.println("[AdminCaregiverController] Caregiver " + cg.getId() + " marked verified=" + cg.getVerified() + " verificationCode=" + cg.getVerificationCode());
            } catch (Exception e) {
                System.err.println("[AdminCaregiverController] Failed to print caregiver debug info: " + e.getMessage());
            }

            // Send email to user
            User user = userRepo.findById(cg.getUserId()).orElse(null);
            if (user != null && user.getEmail() != null) {
                try {
                    String subject = "CareNet - Application Approved";
            String bodyHtml = "<p>Dear " + user.getName() + ",</p>"
                            + "<p>Your caregiver application has been approved. Your verification code: <strong>" + code + "</strong>.</p>"
                            + "<p>Please find your QR code in your caregiver dashboard.</p>"
                            + "<p>Regards,<br/>CareNet Team</p>";
                    emailService.sendSimpleEmail(user.getEmail(), subject, bodyHtml);
                } catch (Exception e) {
                    System.err.println("Failed to send approval email: " + e.getMessage());
                }
            }

            resp.put("caregiverVerified", true);
            resp.put("verificationCode", code);
        }

        return resp;
    }
}
