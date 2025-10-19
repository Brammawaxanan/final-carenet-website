package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.Assignment;
import com.carenet.carenet_backend.repo.AssignmentRepo;
import com.carenet.carenet_backend.service.QRCodeService;
import com.google.zxing.WriterException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
public class AssignmentController {
    
    private final AssignmentRepo assignmentRepo;
    private final QRCodeService qrCodeService;
    
    /**
     * SMART FEATURE 2: Generate QR code for assignment
     */
    @PostMapping("/generateQR/{assignmentId}")
    public Map<String, Object> generateQRCode(@PathVariable Long assignmentId) {
        try {
            Assignment assignment = assignmentRepo.findById(assignmentId)
                    .orElseThrow(() -> new RuntimeException("Assignment not found"));
            
            // Generate verification key if not exists
            if (assignment.getVerificationKey() == null) {
                String verificationKey = qrCodeService.generateVerificationKey(
                    assignmentId, assignment.getBookingId());
                assignment.setVerificationKey(verificationKey);
            }
            
            // Generate QR code data
            String qrData = qrCodeService.generateQRData(
                assignmentId,
                assignment.getBookingId(),
                assignment.getVerificationKey()
            );
            
            // Generate QR code as Base64
            String qrCodeBase64 = qrCodeService.generateQRCodeBase64(qrData);
            assignment.setQrCode(qrCodeBase64);
            
            // Also save as file
            String qrFileName = "assignment_" + assignmentId;
            String qrFilePath = qrCodeService.generateQRCodeFile(qrData, qrFileName);
            assignment.setQrCodePath(qrFilePath);
            
            assignmentRepo.save(assignment);
            
            System.out.println("✅ QR Code generated for Assignment #" + assignmentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("assignmentId", assignmentId);
            response.put("qrCode", qrCodeBase64);
            response.put("qrCodePath", qrFilePath);
            response.put("verificationKey", assignment.getVerificationKey());
            response.put("message", "QR Code generated successfully");
            
            return response;
            
        } catch (WriterException | IOException e) {
            System.err.println("❌ Error generating QR code: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to generate QR code");
            return errorResponse;
        }
    }
    
    /**
     * Get assignments by booking ID with QR codes
     */
    @GetMapping("/byBooking/{bookingId}")
    public Map<String, Object> getAssignmentsByBooking(@PathVariable Long bookingId) {
        List<Assignment> assignments = assignmentRepo.findAll().stream()
                .filter(a -> a.getBookingId() != null && a.getBookingId().equals(bookingId))
                .collect(Collectors.toList());
        
        List<Map<String, Object>> assignmentList = assignments.stream()
                .map(assignment -> {
                    Map<String, Object> aMap = new HashMap<>();
                    aMap.put("id", assignment.getId());
                    aMap.put("bookingId", assignment.getBookingId());
                    aMap.put("status", assignment.getStatus().toString());
                    aMap.put("serviceType", assignment.getServiceType());
                    aMap.put("qrCode", assignment.getQrCode());
                    aMap.put("verificationKey", assignment.getVerificationKey());
                    aMap.put("active", assignment.isActive());
                    aMap.put("createdAt", assignment.getCreatedAt());
                    return aMap;
                })
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("assignments", assignmentList);
        response.put("count", assignmentList.size());
        
        return response;
    }
    
    /**
     * Verify QR code
     */
    @PostMapping("/verify/{verificationKey}")
    public Map<String, Object> verifyQRCode(@PathVariable String verificationKey) {
        Optional<Assignment> assignment = assignmentRepo.findAll().stream()
                .filter(a -> verificationKey.equals(a.getVerificationKey()))
                .findFirst();
        
        if (assignment.isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("valid", false);
            errorResponse.put("message", "Invalid verification key");
            return errorResponse;
        }
        
        Assignment a = assignment.get();
        
        Map<String, Object> response = new HashMap<>();
        response.put("valid", true);
        response.put("assignmentId", a.getId());
        response.put("bookingId", a.getBookingId());
        response.put("status", a.getStatus().toString());
        response.put("serviceType", a.getServiceType());
        response.put("message", "QR Code verified successfully");
        
        System.out.println("✅ QR Code verified for Assignment #" + a.getId());
        
        return response;
    }
    
    /**
     * Get all assignments for a user
     */
    @GetMapping("/user/{userId}")
    public List<Map<String, Object>> getUserAssignments(@PathVariable Long userId) {
        List<Assignment> assignments = assignmentRepo.findAll().stream()
                .filter(a -> a.getClientId().equals(userId))
                .collect(Collectors.toList());
        
        return assignments.stream()
                .map(assignment -> {
                    Map<String, Object> aMap = new HashMap<>();
                    aMap.put("id", assignment.getId());
                    aMap.put("bookingId", assignment.getBookingId());
                    aMap.put("caregiverId", assignment.getCaregiverId());
                    aMap.put("status", assignment.getStatus().toString());
                    aMap.put("serviceType", assignment.getServiceType());
                    aMap.put("qrCode", assignment.getQrCode());
                    aMap.put("verificationKey", assignment.getVerificationKey());
                    aMap.put("active", assignment.isActive());
                    return aMap;
                })
                .collect(Collectors.toList());
    }
}
