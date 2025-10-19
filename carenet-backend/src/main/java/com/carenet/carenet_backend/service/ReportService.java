package com.carenet.carenet_backend.service;

import com.carenet.carenet_backend.domain.*;
import com.carenet.carenet_backend.repo.*;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final UserRepo users;
    private final CaregiverRepo caregivers;
    private final AssignmentRepo assignments;
    private final TaskRepo tasks;
    private final TaskProofRepo proofs;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm")
            .withZone(ZoneId.systemDefault());

    public byte[] generateUserReport(Long userId) throws IOException {
        User user = users.findById(userId).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        List<Assignment> userAssignments = assignments.findByClientId(userId);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float yPosition = 750;
                float margin = 50;
                float pageWidth = page.getMediaBox().getWidth();
                float contentWidth = pageWidth - (2 * margin);

                // ===== STYLED HEADER SECTION =====
                // Draw header background (primary color)
                contentStream.setNonStrokingColor(41, 128, 185); // Blue background
                contentStream.addRect(0, 770, pageWidth, 72);
                contentStream.fill();
                
                // Title
                contentStream.setNonStrokingColor(255, 255, 255); // White text
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 28);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, 795);
                contentStream.showText("CareNet");
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 16);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, 775);
                contentStream.showText("User Activity Report");
                contentStream.endText();
                
                // Reset text color to black
                contentStream.setNonStrokingColor(0, 0, 0);
                yPosition = 730;

                // ===== USER DETAILS SECTION (with background) =====
                float sectionY = yPosition - 5;
                contentStream.setNonStrokingColor(236, 240, 241); // Light gray background
                contentStream.addRect(margin - 10, sectionY - 95, contentWidth + 20, 100);
                contentStream.fill();
                contentStream.setNonStrokingColor(0, 0, 0);
                
                // Section header
                contentStream.setNonStrokingColor(52, 73, 94); // Dark blue-gray
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("Client Information");
                contentStream.endText();
                contentStream.setNonStrokingColor(0, 0, 0);
                yPosition -= 28;

                // User details with icons
                contentStream.setFont(PDType1Font.HELVETICA, 12);
                
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 5, yPosition);
                contentStream.showText("Name:");
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 70, yPosition);
                contentStream.showText(user.getName() != null ? user.getName() : "N/A");
                contentStream.endText();
                yPosition -= 20;

                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 5, yPosition);
                contentStream.showText("Email:");
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 70, yPosition);
                contentStream.showText(user.getEmail() != null ? user.getEmail() : "N/A");
                contentStream.endText();
                yPosition -= 20;

                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 5, yPosition);
                contentStream.showText("User ID:");
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 70, yPosition);
                contentStream.showText(String.valueOf(userId));
                contentStream.endText();
                yPosition -= 20;

                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 5, yPosition);
                contentStream.showText("Generated:");
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 70, yPosition);
                contentStream.showText(DATE_FORMATTER.format(Instant.now()));
                contentStream.endText();
                yPosition -= 45;

                // ===== TASKS SECTION HEADER =====
                contentStream.setNonStrokingColor(52, 73, 94);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("Assignments & Tasks");
                contentStream.endText();
                contentStream.setNonStrokingColor(0, 0, 0);
                
                // Underline
                contentStream.setStrokingColor(41, 128, 185);
                contentStream.setLineWidth(2);
                contentStream.moveTo(margin, yPosition - 5);
                contentStream.lineTo(margin + 200, yPosition - 5);
                contentStream.stroke();
                contentStream.setStrokingColor(0, 0, 0);
                yPosition -= 30;

                int totalTasks = 0;
                int completedTasks = 0;

                if (userAssignments.isEmpty()) {
                    // Empty state box
                    contentStream.setStrokingColor(189, 195, 199);
                    contentStream.setLineWidth(1.5f);
                    contentStream.addRect(margin, yPosition - 40, contentWidth, 50);
                    contentStream.stroke();
                    
                    contentStream.setNonStrokingColor(127, 140, 141);
                    contentStream.setFont(PDType1Font.HELVETICA_OBLIQUE, 12);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin + 20, yPosition - 20);
                    contentStream.showText("No assignments or tasks available.");
                    contentStream.endText();
                    contentStream.setNonStrokingColor(0, 0, 0);
                    yPosition -= 60;
                } else {
                    for (Assignment assignment : userAssignments) {
                        // Get caregiver name
                        String caregiverName = caregivers.findById(assignment.getCaregiverId())
                                .map(Caregiver::getName)
                                .orElse("Unknown Caregiver");

                        // Assignment card with border
                        float cardTop = yPosition + 5;
                        
                        // Assignment header with colored background
                        contentStream.setNonStrokingColor(52, 152, 219); // Blue
                        contentStream.addRect(margin, yPosition - 18, contentWidth, 22);
                        contentStream.fill();
                        
                        contentStream.setNonStrokingColor(255, 255, 255); // White text
                        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                        contentStream.beginText();
                        contentStream.newLineAtOffset(margin + 10, yPosition - 14);
                        contentStream.showText("Assignment #" + assignment.getId() + 
                                " - " + (assignment.getServiceType() != null ? assignment.getServiceType() : "Service"));
                        contentStream.endText();
                        contentStream.setNonStrokingColor(0, 0, 0);
                        yPosition -= 26;

                        contentStream.setFont(PDType1Font.HELVETICA, 10);
                        contentStream.setNonStrokingColor(44, 62, 80);
                        contentStream.beginText();
                        contentStream.newLineAtOffset(margin + 10, yPosition);
                        contentStream.showText("Caregiver: " + caregiverName);
                        contentStream.endText();
                        contentStream.setNonStrokingColor(0, 0, 0);
                        yPosition -= 20;

                        // Get tasks for this assignment
                        List<Task> assignmentTasks = tasks.findByAssignmentIdOrderByCreatedAtAsc(assignment.getId());
                        totalTasks += assignmentTasks.size();

                        for (Task task : assignmentTasks) {
                            // Check for new page (removed buggy recursive logic)
                            if (yPosition < 100) {
                                yPosition = 100; // Keep on same page for now
                            }

                            boolean hasProof = !proofs.findByTaskId(task.getId()).isEmpty();
                            boolean isCompleted = task.getStatus() == TaskStatus.COMPLETED || 
                                    task.getStatus() == TaskStatus.VERIFIED ||
                                    task.getStatus() == TaskStatus.LOCKED;
                            
                            if (isCompleted) completedTasks++;

                            // Task item with bullet and status indicator
                            contentStream.setFont(PDType1Font.HELVETICA, 10);
                            contentStream.beginText();
                            contentStream.newLineAtOffset(margin + 20, yPosition);
                            contentStream.showText("\u2022 " + task.getTitle());
                            contentStream.endText();
                            
                            // Status badge
                            float statusX = margin + 320;
                            if (isCompleted) {
                                contentStream.setNonStrokingColor(46, 204, 113); // Green
                            } else {
                                contentStream.setNonStrokingColor(241, 196, 15); // Yellow
                            }
                            contentStream.addRect(statusX, yPosition - 2, 60, 12);
                            contentStream.fill();
                            
                            contentStream.setNonStrokingColor(255, 255, 255);
                            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 8);
                            contentStream.beginText();
                            contentStream.newLineAtOffset(statusX + 5, yPosition + 2);
                            contentStream.showText(isCompleted ? "COMPLETED" : "PENDING");
                            contentStream.endText();
                            contentStream.setNonStrokingColor(0, 0, 0);
                            
                            // Proof indicator
                            if (hasProof) {
                                contentStream.setNonStrokingColor(52, 152, 219);
                                contentStream.setFont(PDType1Font.HELVETICA, 8);
                                contentStream.beginText();
                                contentStream.newLineAtOffset(statusX + 70, yPosition + 2);
                                contentStream.showText("\u2713 Proof");
                                contentStream.endText();
                                contentStream.setNonStrokingColor(0, 0, 0);
                            }
                            
                            yPosition -= 15;

                            if (task.getDueAt() != null) {
                                contentStream.setFont(PDType1Font.HELVETICA, 9);
                                contentStream.beginText();
                                contentStream.newLineAtOffset(margin + 30, yPosition);
                                contentStream.showText("Due: " + DATE_FORMATTER.format(task.getDueAt()));
                                contentStream.endText();
                                yPosition -= 12;
                            }
                        }
                        yPosition -= 10;
                    }
                }

                // ===== SUMMARY SECTION (colored boxes) =====
                yPosition -= 30;
                
                contentStream.setNonStrokingColor(52, 73, 94);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("Summary");
                contentStream.endText();
                yPosition -= 30;
                
                float boxWidth = (contentWidth - 20) / 3;
                float boxHeight = 60;
                
                // Box 1: Total Assignments (Blue)
                contentStream.setNonStrokingColor(52, 152, 219);
                contentStream.addRect(margin, yPosition - boxHeight, boxWidth, boxHeight);
                contentStream.fill();
                
                contentStream.setNonStrokingColor(255, 255, 255);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 24);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + (boxWidth / 2) - 15, yPosition - 25);
                contentStream.showText(String.valueOf(userAssignments.size()));
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 10);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 10, yPosition - 45);
                contentStream.showText("Total Assignments");
                contentStream.endText();
                
                // Box 2: Total Tasks (Green)
                contentStream.setNonStrokingColor(46, 204, 113);
                contentStream.addRect(margin + boxWidth + 10, yPosition - boxHeight, boxWidth, boxHeight);
                contentStream.fill();
                
                contentStream.setNonStrokingColor(255, 255, 255);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 24);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + boxWidth + 10 + (boxWidth / 2) - 15, yPosition - 25);
                contentStream.showText(String.valueOf(totalTasks));
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 10);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + boxWidth + 20, yPosition - 45);
                contentStream.showText("Total Tasks");
                contentStream.endText();
                
                // Box 3: Completed Tasks (Orange)
                contentStream.setNonStrokingColor(230, 126, 34);
                contentStream.addRect(margin + (boxWidth * 2) + 20, yPosition - boxHeight, boxWidth, boxHeight);
                contentStream.fill();
                
                contentStream.setNonStrokingColor(255, 255, 255);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 24);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + (boxWidth * 2) + 20 + (boxWidth / 2) - 15, yPosition - 25);
                contentStream.showText(String.valueOf(completedTasks));
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 10);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + (boxWidth * 2) + 30, yPosition - 45);
                contentStream.showText("Completed Tasks");
                contentStream.endText();
                
                contentStream.setNonStrokingColor(0, 0, 0);
                yPosition -= (boxHeight + 20);
                
                // Footer
                contentStream.setNonStrokingColor(127, 140, 141);
                contentStream.setFont(PDType1Font.HELVETICA_OBLIQUE, 9);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, 40);
                contentStream.showText("CareNet - Connecting Care, Building Trust");
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.newLineAtOffset(pageWidth - margin - 150, 40);
                contentStream.showText("Page 1 of 1");
                contentStream.endText();
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.save(outputStream);
            return outputStream.toByteArray();
        }
    }

    public byte[] generateCaregiverReportByUserId(Long userId) throws IOException {
        // Find caregiver by userId
        Caregiver caregiver = caregivers.findAll().stream()
                .filter(c -> c.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Caregiver not found for user ID: " + userId));
        
        return generateCaregiverReport(caregiver.getId());
    }

    public byte[] generateCaregiverReport(Long caregiverId) throws IOException {
        Caregiver caregiver = caregivers.findById(caregiverId).orElse(null);
        if (caregiver == null) {
            throw new IllegalArgumentException("Caregiver not found");
        }

        List<Assignment> caregiverAssignments = assignments.findByCaregiverId(caregiverId);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float yPosition = 750;
                float margin = 50;
                float pageWidth = page.getMediaBox().getWidth();
                float contentWidth = pageWidth - (2 * margin);

                // ===== STYLED HEADER SECTION =====
                // Draw header background (green for caregiver)
                contentStream.setNonStrokingColor(46, 204, 113); // Green background
                contentStream.addRect(0, 770, pageWidth, 72);
                contentStream.fill();
                
                // Title
                contentStream.setNonStrokingColor(255, 255, 255); // White text
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 28);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, 795);
                contentStream.showText("CareNet");
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 16);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, 775);
                contentStream.showText("Caregiver Activity Report");
                contentStream.endText();
                
                // Reset text color to black
                contentStream.setNonStrokingColor(0, 0, 0);
                yPosition = 730;

                // ===== CAREGIVER DETAILS SECTION (with background) =====
                float sectionY = yPosition - 5;
                contentStream.setNonStrokingColor(236, 240, 241); // Light gray background
                contentStream.addRect(margin - 10, sectionY - 95, contentWidth + 20, 100);
                contentStream.fill();
                contentStream.setNonStrokingColor(0, 0, 0);
                
                // Section header
                contentStream.setNonStrokingColor(39, 174, 96); // Green
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("Caregiver Information");
                contentStream.endText();
                contentStream.setNonStrokingColor(0, 0, 0);
                yPosition -= 28;

                // Get caregiver email from User table
                String caregiverEmail = users.findById(caregiver.getUserId())
                        .map(User::getEmail)
                        .orElse("N/A");

                // Caregiver details with labels
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 5, yPosition);
                contentStream.showText("Name:");
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 70, yPosition);
                contentStream.showText(caregiver.getName() != null ? caregiver.getName() : "N/A");
                contentStream.endText();
                yPosition -= 20;

                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 5, yPosition);
                contentStream.showText("Email:");
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 70, yPosition);
                contentStream.showText(caregiverEmail);
                contentStream.endText();
                yPosition -= 20;

                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 5, yPosition);
                contentStream.showText("Caregiver ID:");
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 70, yPosition);
                contentStream.showText(String.valueOf(caregiverId));
                contentStream.endText();
                yPosition -= 20;

                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 5, yPosition);
                contentStream.showText("Generated:");
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 70, yPosition);
                contentStream.showText(DATE_FORMATTER.format(Instant.now()));
                contentStream.endText();
                yPosition -= 45;

                // ===== TASKS SECTION HEADER =====
                contentStream.setNonStrokingColor(39, 174, 96);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("Assignments & Tasks");
                contentStream.endText();
                contentStream.setNonStrokingColor(0, 0, 0);
                
                // Underline
                contentStream.setStrokingColor(46, 204, 113);
                contentStream.setLineWidth(2);
                contentStream.moveTo(margin, yPosition - 5);
                contentStream.lineTo(margin + 200, yPosition - 5);
                contentStream.stroke();
                contentStream.setStrokingColor(0, 0, 0);
                yPosition -= 30;

                int totalTasks = 0;
                int completedTasks = 0;
                int pendingTasks = 0;

                if (caregiverAssignments.isEmpty()) {
                    // Empty state box
                    contentStream.setStrokingColor(189, 195, 199);
                    contentStream.setLineWidth(1.5f);
                    contentStream.addRect(margin, yPosition - 40, contentWidth, 50);
                    contentStream.stroke();
                    
                    contentStream.setNonStrokingColor(127, 140, 141);
                    contentStream.setFont(PDType1Font.HELVETICA_OBLIQUE, 12);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin + 20, yPosition - 20);
                    contentStream.showText("No assignments or tasks available.");
                    contentStream.endText();
                    contentStream.setNonStrokingColor(0, 0, 0);
                    yPosition -= 60;
                } else {
                    for (Assignment assignment : caregiverAssignments) {
                        // Get client name
                        String clientName = users.findById(assignment.getClientId())
                                .map(User::getName)
                                .orElse("Unknown Client");

                        // Assignment card with colored header
                        contentStream.setNonStrokingColor(46, 204, 113); // Green
                        contentStream.addRect(margin, yPosition - 18, contentWidth, 22);
                        contentStream.fill();
                        
                        contentStream.setNonStrokingColor(255, 255, 255); // White text
                        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                        contentStream.beginText();
                        contentStream.newLineAtOffset(margin + 10, yPosition - 14);
                        contentStream.showText("Assignment #" + assignment.getId() + 
                                " - " + (assignment.getServiceType() != null ? assignment.getServiceType() : "Service"));
                        contentStream.endText();
                        contentStream.setNonStrokingColor(0, 0, 0);
                        yPosition -= 26;

                        contentStream.setFont(PDType1Font.HELVETICA, 10);
                        contentStream.setNonStrokingColor(44, 62, 80);
                        contentStream.beginText();
                        contentStream.newLineAtOffset(margin + 10, yPosition);
                        contentStream.showText("Client: " + clientName);
                        contentStream.endText();
                        contentStream.setNonStrokingColor(0, 0, 0);
                        yPosition -= 20;

                        // Get tasks
                        List<Task> assignmentTasks = tasks.findByAssignmentIdOrderByCreatedAtAsc(assignment.getId());
                        totalTasks += assignmentTasks.size();

                        for (Task task : assignmentTasks) {
                            if (yPosition < 100) {
                                // Simple handling - in production, create new page properly
                                break;
                            }

                            boolean isCompleted = task.getStatus() == TaskStatus.COMPLETED || 
                                    task.getStatus() == TaskStatus.VERIFIED ||
                                    task.getStatus() == TaskStatus.LOCKED;
                            
                            if (isCompleted) {
                                completedTasks++;
                            } else {
                                pendingTasks++;
                            }

                            // Task item with bullet and status badge
                            contentStream.setFont(PDType1Font.HELVETICA, 10);
                            contentStream.beginText();
                            contentStream.newLineAtOffset(margin + 20, yPosition);
                            contentStream.showText("\u2022 " + task.getTitle());
                            contentStream.endText();
                            
                            // Status badge
                            float statusX = margin + 320;
                            if (isCompleted) {
                                contentStream.setNonStrokingColor(46, 204, 113); // Green
                            } else {
                                contentStream.setNonStrokingColor(241, 196, 15); // Yellow
                            }
                            contentStream.addRect(statusX, yPosition - 2, 60, 12);
                            contentStream.fill();
                            
                            contentStream.setNonStrokingColor(255, 255, 255);
                            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 8);
                            contentStream.beginText();
                            contentStream.newLineAtOffset(statusX + 5, yPosition + 2);
                            contentStream.showText(isCompleted ? "COMPLETED" : "PENDING");
                            contentStream.endText();
                            contentStream.setNonStrokingColor(0, 0, 0);
                            
                            yPosition -= 15;

                            if (task.getDueAt() != null) {
                                contentStream.setFont(PDType1Font.HELVETICA, 9);
                                contentStream.beginText();
                                contentStream.newLineAtOffset(margin + 30, yPosition);
                                contentStream.showText("Due: " + DATE_FORMATTER.format(task.getDueAt()));
                                contentStream.endText();
                                yPosition -= 12;
                            }
                        }
                        yPosition -= 10;
                    }
                }

                // ===== SUMMARY SECTION (colored boxes) =====
                yPosition -= 30;
                
                contentStream.setNonStrokingColor(39, 174, 96);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("Performance Summary");
                contentStream.endText();
                yPosition -= 30;
                
                float boxWidth = (contentWidth - 30) / 4;
                float boxHeight = 60;
                
                // Box 1: Total Assignments (Green)
                contentStream.setNonStrokingColor(46, 204, 113);
                contentStream.addRect(margin, yPosition - boxHeight, boxWidth, boxHeight);
                contentStream.fill();
                
                contentStream.setNonStrokingColor(255, 255, 255);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 22);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + (boxWidth / 2) - 12, yPosition - 25);
                contentStream.showText(String.valueOf(caregiverAssignments.size()));
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 9);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 8, yPosition - 45);
                contentStream.showText("Assignments");
                contentStream.endText();
                
                // Box 2: Total Tasks (Blue)
                contentStream.setNonStrokingColor(52, 152, 219);
                contentStream.addRect(margin + boxWidth + 10, yPosition - boxHeight, boxWidth, boxHeight);
                contentStream.fill();
                
                contentStream.setNonStrokingColor(255, 255, 255);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 22);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + boxWidth + 10 + (boxWidth / 2) - 12, yPosition - 25);
                contentStream.showText(String.valueOf(totalTasks));
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 9);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + boxWidth + 18, yPosition - 45);
                contentStream.showText("Total Tasks");
                contentStream.endText();
                
                // Box 3: Completed Tasks (Teal)
                contentStream.setNonStrokingColor(26, 188, 156);
                contentStream.addRect(margin + (boxWidth * 2) + 20, yPosition - boxHeight, boxWidth, boxHeight);
                contentStream.fill();
                
                contentStream.setNonStrokingColor(255, 255, 255);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 22);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + (boxWidth * 2) + 20 + (boxWidth / 2) - 12, yPosition - 25);
                contentStream.showText(String.valueOf(completedTasks));
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 9);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + (boxWidth * 2) + 28, yPosition - 45);
                contentStream.showText("Completed");
                contentStream.endText();
                
                // Box 4: Pending Tasks (Orange)
                contentStream.setNonStrokingColor(230, 126, 34);
                contentStream.addRect(margin + (boxWidth * 3) + 30, yPosition - boxHeight, boxWidth, boxHeight);
                contentStream.fill();
                
                contentStream.setNonStrokingColor(255, 255, 255);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 22);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + (boxWidth * 3) + 30 + (boxWidth / 2) - 12, yPosition - 25);
                contentStream.showText(String.valueOf(pendingTasks));
                contentStream.endText();
                
                contentStream.setFont(PDType1Font.HELVETICA, 9);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + (boxWidth * 3) + 38, yPosition - 45);
                contentStream.showText("Pending");
                contentStream.endText();
                
                contentStream.setNonStrokingColor(0, 0, 0);
                yPosition -= (boxHeight + 20);
                
                // Footer
                contentStream.setNonStrokingColor(127, 140, 141);
                contentStream.setFont(PDType1Font.HELVETICA_OBLIQUE, 9);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, 40);
                contentStream.showText("CareNet - Connecting Care, Building Trust");
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.newLineAtOffset(pageWidth - margin - 150, 40);
                contentStream.showText("Page 1 of 1");
                contentStream.endText();
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.save(outputStream);
            return outputStream.toByteArray();
        }
    }

    public byte[] generateAssignmentReport(Long assignmentId) throws IOException {
        Assignment assignment = assignments.findById(assignmentId).orElse(null);
        if (assignment == null) {
            throw new IllegalArgumentException("Assignment not found");
        }

        // Get related data
        User client = users.findById(assignment.getClientId()).orElse(null);
        Caregiver caregiver = caregivers.findById(assignment.getCaregiverId()).orElse(null);
        List<Task> assignmentTasks = tasks.findByAssignmentIdOrderByCreatedAtAsc(assignmentId);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            float pageWidth = page.getMediaBox().getWidth();
            float pageHeight = page.getMediaBox().getHeight();
            float margin = 50;
            float yPosition = pageHeight - margin;
            float contentWidth = pageWidth - (2 * margin);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                // Header with gradient effect
                contentStream.setNonStrokingColor(52, 152, 219);
                contentStream.addRect(0, pageHeight - 100, pageWidth, 100);
                contentStream.fill();

                contentStream.setNonStrokingColor(255, 255, 255);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 28);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, pageHeight - 60);
                contentStream.showText("CareNet - Assignment Task Report");
                contentStream.endText();

                // Assignment ID
                contentStream.setFont(PDType1Font.HELVETICA, 12);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, pageHeight - 82);
                contentStream.showText("Assignment #" + assignmentId);
                contentStream.endText();

                contentStream.setNonStrokingColor(0, 0, 0);
                yPosition = pageHeight - 130;

                // Assignment Details Box
                contentStream.setNonStrokingColor(241, 248, 255);
                contentStream.addRect(margin, yPosition - 100, contentWidth, 100);
                contentStream.fill();
                contentStream.setNonStrokingColor(52, 152, 219);
                contentStream.setLineWidth(2);
                contentStream.addRect(margin, yPosition - 100, contentWidth, 100);
                contentStream.stroke();

                contentStream.setNonStrokingColor(0, 0, 0);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 10, yPosition - 20);
                contentStream.showText("Assignment Details");
                contentStream.endText();

                contentStream.setFont(PDType1Font.HELVETICA, 11);
                yPosition -= 40;

                // Client info
                String clientName = client != null ? client.getName() : "Unknown Client";
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 10, yPosition);
                contentStream.showText("Client: " + clientName);
                contentStream.endText();
                yPosition -= 18;

                // Caregiver info
                String caregiverName = caregiver != null ? caregiver.getName() : "Unknown Caregiver";
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 10, yPosition);
                contentStream.showText("Caregiver: " + caregiverName);
                contentStream.endText();
                yPosition -= 18;

                // Service type and status
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 10, yPosition);
                contentStream.showText("Service: " + (assignment.getServiceType() != null ? assignment.getServiceType() : "N/A") + 
                                      "  |  Status: " + assignment.getStatus().name());
                contentStream.endText();

                yPosition -= 50;

                // Tasks Section
                contentStream.setNonStrokingColor(52, 152, 219);
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("Tasks (" + assignmentTasks.size() + " total)");
                contentStream.endText();
                contentStream.setNonStrokingColor(0, 0, 0);

                yPosition -= 30;

                // Task stats
                int completedCount = (int) assignmentTasks.stream().filter(t -> t.getStatus() == TaskStatus.VERIFIED).count();
                int pendingCount = assignmentTasks.size() - completedCount;

                contentStream.setFont(PDType1Font.HELVETICA, 10);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("Completed: " + completedCount + " | Pending: " + pendingCount);
                contentStream.endText();

                yPosition -= 25;

                // Render each task
                for (Task task : assignmentTasks) {
                    if (yPosition < 100) break; // Prevent overflow for now

                    // Task card background
                    contentStream.setNonStrokingColor(250, 250, 250);
                    contentStream.addRect(margin, yPosition - 65, contentWidth, 60);
                    contentStream.fill();
                    
                    // Task border
                    contentStream.setStrokingColor(200, 200, 200);
                    contentStream.setLineWidth(1);
                    contentStream.addRect(margin, yPosition - 65, contentWidth, 60);
                    contentStream.stroke();

                    contentStream.setNonStrokingColor(0, 0, 0);
                    
                    // Task title
                    contentStream.setFont(PDType1Font.HELVETICA_BOLD, 11);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin + 10, yPosition - 15);
                    contentStream.showText(task.getTitle());
                    contentStream.endText();

                    // Task status badge
                    String statusText = task.getStatus().name();
                    float statusX = margin + contentWidth - 80;
                    contentStream.setNonStrokingColor(task.getStatus() == TaskStatus.VERIFIED ? 46 : 241, 
                                                      task.getStatus() == TaskStatus.VERIFIED ? 204 : 196, 
                                                      task.getStatus() == TaskStatus.VERIFIED ? 113 : 15);
                    contentStream.addRect(statusX, yPosition - 18, 70, 16);
                    contentStream.fill();
                    
                    contentStream.setNonStrokingColor(255, 255, 255);
                    contentStream.setFont(PDType1Font.HELVETICA_BOLD, 9);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(statusX + 5, yPosition - 13);
                    contentStream.showText(statusText);
                    contentStream.endText();

                    // Task description
                    contentStream.setNonStrokingColor(100, 100, 100);
                    contentStream.setFont(PDType1Font.HELVETICA, 9);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin + 10, yPosition - 35);
                    String desc = task.getDescription() != null && task.getDescription().length() > 80 
                                  ? task.getDescription().substring(0, 77) + "..." 
                                  : (task.getDescription() != null ? task.getDescription() : "No description");
                    contentStream.showText(desc);
                    contentStream.endText();

                    // Created date
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin + 10, yPosition - 50);
                    contentStream.showText("Created: " + DATE_FORMATTER.format(task.getCreatedAt()));
                    contentStream.endText();

                    contentStream.setNonStrokingColor(0, 0, 0);
                    yPosition -= 75;
                }

                // Footer
                contentStream.setNonStrokingColor(127, 140, 141);
                contentStream.setFont(PDType1Font.HELVETICA_OBLIQUE, 9);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, 40);
                contentStream.showText("CareNet - Assignment Report Generated on " + 
                                      DATE_FORMATTER.format(Instant.now()));
                contentStream.endText();
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.save(outputStream);
            return outputStream.toByteArray();
        }
    }
}
