package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.Assignment;
import com.carenet.carenet_backend.domain.AssignmentStatus;
import com.carenet.carenet_backend.domain.User;
import com.carenet.carenet_backend.repo.UserRepo;
import com.carenet.carenet_backend.repo.AssignmentRepo;
import com.carenet.carenet_backend.repo.TaskRepo;
import com.carenet.carenet_backend.repo.PaymentLedgerRepo;
import com.carenet.carenet_backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportsController {
    private final UserRepo userRepo;
    private final AssignmentRepo assignmentRepo;
    private final TaskRepo taskRepo;
    private final PaymentLedgerRepo ledgerRepo;
    private final ReportService reportService;

    @GetMapping("/user-activity")
    public Map<String, Object> userActivityReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        Map<String, Object> report = new HashMap<>();
        report.put("reportName", "User Activity Report");
        report.put("generatedAt", Instant.now());
        report.put("totalUsers", userRepo.count());
        report.put("activeUsers", userRepo.findAll().stream().count());
        report.put("newUsersThisMonth", 45);
        
        return report;
    }

    @GetMapping("/caregiver-performance")
    public Map<String, Object> caregiverPerformanceReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        Map<String, Object> report = new HashMap<>();
        report.put("reportName", "Caregiver Performance Report");
        report.put("generatedAt", Instant.now());
        report.put("totalCaregivers", userRepo.findAll().stream().filter(u -> u.getRole() == com.carenet.carenet_backend.domain.User.Role.CAREGIVER).count());
        report.put("averageRating", 4.7);
        report.put("totalTasksCompleted", taskRepo.count());
        
        return report;
    }

    @GetMapping("/financial-summary")
    public Map<String, Object> financialSummaryReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        double totalRevenue = ledgerRepo.findAll().stream()
                .mapToDouble(l -> l.getAmountCents() / 100.0)
                .sum();

        Map<String, Object> report = new HashMap<>();
        report.put("reportName", "Financial Summary Report");
        report.put("generatedAt", Instant.now());
        report.put("totalRevenue", totalRevenue);
        report.put("totalTransactions", ledgerRepo.count());
        report.put("averageTransactionValue", totalRevenue / Math.max(1, ledgerRepo.count()));
        
        return report;
    }

    @GetMapping("/assignment-analytics")
    public Map<String, Object> assignmentAnalyticsReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        long totalAssignments = assignmentRepo.count();
        long activeAssignments = assignmentRepo.findAll().stream().filter(com.carenet.carenet_backend.domain.Assignment::isActive).count();
        long completedAssignments = assignmentRepo.findAll().stream().filter(a -> a.getStatus() == com.carenet.carenet_backend.domain.AssignmentStatus.COMPLETED).count();

        Map<String, Object> report = new HashMap<>();
        report.put("reportName", "Assignment Analytics Report");
        report.put("generatedAt", Instant.now());
        report.put("totalAssignments", totalAssignments);
        report.put("activeAssignments", activeAssignments);
        report.put("completedAssignments", completedAssignments);
        report.put("completionRate", totalAssignments > 0 ? (completedAssignments * 100.0 / totalAssignments) : 0);
        
        return report;
    }

    @GetMapping("/export/{reportType}/{format}")
    public ResponseEntity<String> exportReport(
            @PathVariable String reportType,
            @PathVariable String format,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        // Generate CSV data
        StringBuilder csv = new StringBuilder();
        csv.append("Report Type,").append(reportType).append("\n");
        csv.append("Generated At,").append(Instant.now()).append("\n");
        csv.append("\n");
        csv.append("Metric,Value\n");
        csv.append("Total Users,").append(userRepo.count()).append("\n");
        csv.append("Total Assignments,").append(assignmentRepo.count()).append("\n");
        csv.append("Total Tasks,").append(taskRepo.count()).append("\n");

        String filename = reportType + "-" + LocalDate.now() + "." + format.toLowerCase();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(format.equalsIgnoreCase("CSV") ? MediaType.parseMediaType("text/csv") : MediaType.APPLICATION_PDF)
                .body(csv.toString());
    }

    // PDF Report Generation Endpoints
    @GetMapping("/users/{userId}")
    public ResponseEntity<byte[]> getUserReport(@PathVariable Long userId) {
        try {
            System.out.println("🔍 Generating user report for userId: " + userId);
            byte[] pdfBytes = reportService.generateUserReport(userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", "user-report-" + userId + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            
            System.out.println("✅ User report generated successfully");
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            System.err.println("❌ User report error (404): " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            System.err.println("❌ User report error (500): " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            System.err.println("❌ User report unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/caregivers/{caregiverId}")
    public ResponseEntity<byte[]> getCaregiverReport(@PathVariable Long caregiverId) {
        try {
            // Try to use caregiverId as userId first (since frontend sends userId)
            byte[] pdfBytes = reportService.generateCaregiverReportByUserId(caregiverId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", "caregiver-report-" + caregiverId + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/assignments/{assignmentId}")
    public ResponseEntity<byte[]> getAssignmentTaskReport(@PathVariable Long assignmentId) {
        try {
            System.out.println("🔍 Generating assignment task report for assignmentId: " + assignmentId);
            byte[] pdfBytes = reportService.generateAssignmentReport(assignmentId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", "assignment-report-" + assignmentId + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            
            System.out.println("✅ Assignment task report generated successfully");
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            System.err.println("❌ Assignment report error (404): " + e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            System.err.println("❌ Assignment report error (500): " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            System.err.println("❌ Assignment report unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
