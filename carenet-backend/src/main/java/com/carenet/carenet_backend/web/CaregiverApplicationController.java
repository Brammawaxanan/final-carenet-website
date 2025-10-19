package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.Caregiver;
import com.carenet.carenet_backend.domain.CaregiverDocument;
import com.carenet.carenet_backend.repo.CaregiverRepo;
import com.carenet.carenet_backend.repo.CaregiverDocumentRepo;
import com.carenet.carenet_backend.repo.UserRepo;
import com.carenet.carenet_backend.domain.User;
import lombok.RequiredArgsConstructor;
import com.carenet.carenet_backend.service.EmailService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/caregivers")
@RequiredArgsConstructor
public class CaregiverApplicationController {
    private final CaregiverRepo caregiverRepo;
    private final CaregiverDocumentRepo documentRepo;
    private final UserRepo userRepo;
    private final EmailService emailService;

    // Simple DTO shape expected from frontend JSON submit
    public static class CaregiverApplicationDTO {
        public String caregiverType;
        public String email;
        public String address;
        public String city;
        public String state;
        public String zipCode;
        public String dateOfBirth;
        public String ssn;
        public String emergencyContactName;
        public String emergencyContactPhone;
        public String experience;
        public String certifications;
        public String availability;
        public String specializations;
    }

    @PostMapping("/apply")
    public Map<String, Object> applyWithoutFiles(
            @RequestHeader(name = "User-ID", required = false) Long userId,
            @RequestBody CaregiverApplicationDTO dto) {

        Long uid = userId != null ? userId : 0L;

        User user = userRepo.findById(uid).orElse(null);

        // If user exists, create or update caregiver profile tied to userId
        Caregiver caregiver = caregiverRepo.findByUserId(uid).orElse(null);
        if (caregiver == null) {
            caregiver = new Caregiver();
            caregiver.setUserId(uid);
        }

        caregiver.setName(user != null ? user.getName() : (dto.email != null ? dto.email : "Unnamed Caregiver"));
        caregiver.setBio(dto.specializations != null ? dto.specializations : dto.certifications != null ? dto.certifications : "");
        caregiver.setHourlyRateCents(2500);
        caregiver.setExperience(dto.experience != null && !dto.experience.isBlank() ? Math.min(100, dto.experience.length()) : 0);
        caregiver.setSkills(dto.certifications != null ? dto.certifications : "General Care");
        caregiver.setVerified(false);
        caregiver = caregiverRepo.save(caregiver);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", caregiver.getId());
        resp.put("message", "Application received");

        // Send confirmation email to the applicant (best effort)
        try {
            String toEmail = dto != null && dto.email != null ? dto.email : (user != null ? user.getName() : null);
            if (toEmail != null && !toEmail.isBlank()) {
                String subject = "CareNet - Application Received";
                String body = "<p>Dear applicant,</p>"
                        + "<p>Thank you for submitting your caregiver application. Your application id is <strong>" + caregiver.getId() + "</strong>." 
                        + "We will review your application and get back to you with next steps.</p>"
                        + "<p>Regards,<br/>CareNet Team</p>";
                emailService.sendSimpleEmail(toEmail, subject, body);
            }
        } catch (Exception e) {
            System.err.println("Failed to send application confirmation email: " + e.getMessage());
        }
        return resp;
    }

    @PostMapping(value = "/apply-with-files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> applyWithFiles(
            @RequestHeader(name = "User-ID", required = false) Long userId,
            @RequestPart(name = "applicationData", required = false) String applicationDataJson,
            @RequestPart(name = "files", required = false) MultipartFile[] files
    ) {
        Long uid = userId != null ? userId : 0L;

        // Parse applicationDataJson if present
        CaregiverApplicationDTO dto = null;
        try {
            if (applicationDataJson != null && !applicationDataJson.isBlank()) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                dto = mapper.readValue(applicationDataJson, CaregiverApplicationDTO.class);
            }
        } catch (Exception e) {
            // ignore and continue with null dto
            dto = null;
        }

        Caregiver caregiver = caregiverRepo.findByUserId(uid).orElse(null);
        if (caregiver == null) {
            caregiver = new Caregiver();
            caregiver.setUserId(uid);
        }

        caregiver.setName(dto != null && dto.email != null ? dto.email : "Unnamed Caregiver");
        caregiver.setBio(dto != null ? dto.specializations : "");
        caregiver.setHourlyRateCents(2500);
        caregiver.setExperience(dto != null && dto.experience != null ? Math.min(100, dto.experience.length()) : 0);
        caregiver.setSkills(dto != null && dto.certifications != null ? dto.certifications : "General Care");
        caregiver.setVerified(false);
        caregiver = caregiverRepo.save(caregiver);

        // Save files as base64 LOBs with category if present in original filename (frontend may set file metadata differently)
        if (files != null) {
            for (MultipartFile f : files) {
                try {
                    byte[] bytes = f.getBytes();
                    String base64 = Base64.getEncoder().encodeToString(bytes);
                    String contentType = f.getContentType() != null ? f.getContentType() : "application/octet-stream";
                    String dataUrl = "data:" + contentType + ";base64," + base64;

                    CaregiverDocument doc = new CaregiverDocument();
                    doc.setCaregiverId(caregiver.getId());
                    doc.setFileName(f.getOriginalFilename() != null ? f.getOriginalFilename() : "file");
                    doc.setContentType(contentType);
                    doc.setFileUrl(dataUrl);
                    doc.setUploadedAt(Instant.now());
                    // Attempt to infer category from filename prefix like id_, medical_, license_
                    String fn = f.getOriginalFilename() != null ? f.getOriginalFilename().toLowerCase() : "";
                    if (fn.startsWith("id") || fn.contains("id")) doc.setCategory("id");
                    else if (fn.contains("medical")) doc.setCategory("medical");
                    else if (fn.contains("license")) doc.setCategory("license");
                    else if (fn.contains("background")) doc.setCategory("background");
                    else if (fn.contains("training")) doc.setCategory("training");
                    else doc.setCategory(null);

                    documentRepo.save(doc);
                } catch (Exception e) {
                    System.err.println("Failed to save uploaded file: " + e.getMessage());
                }
            }
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", caregiver.getId());
        resp.put("message", "Application with files received");

        // Send confirmation email to the applicant (best effort)
        try {
            String toEmail = dto != null && dto.email != null ? dto.email : null;
            if (toEmail != null && !toEmail.isBlank()) {
                String subject = "CareNet - Application Received";
                String body = "<p>Dear applicant,</p>"
                        + "<p>Thank you for submitting your caregiver application along with documents. Your application id is <strong>" + caregiver.getId() + "</strong>." 
                        + "We will review your application and notify you of the results.</p>"
                        + "<p>Regards,<br/>CareNet Team</p>";
                emailService.sendSimpleEmail(toEmail, subject, body);
            }
        } catch (Exception e) {
            System.err.println("Failed to send application confirmation email (with files): " + e.getMessage());
        }
        return resp;
    }
}
