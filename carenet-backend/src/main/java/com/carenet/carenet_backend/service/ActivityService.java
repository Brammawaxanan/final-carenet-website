package com.carenet.carenet_backend.service;

import com.carenet.carenet_backend.domain.*;
import com.carenet.carenet_backend.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ActivityService {
    private final TaskRepo tasks;
    private final PaymentLedgerRepo ledger;
    private final TaskProofRepo proofs;
    private final AssignmentRepo assignments;
    private final UserRepo users;
    private final CaregiverRepo caregivers;

    public Map<String, Object> overview(Long assignmentId) {
        // Fetch assignment details
        Assignment assignment = assignments.findById(assignmentId).orElse(null);
        String caregiverName = null;
        String clientName = null;
        
        // Get caregiver and client names if assignment exists
        if (assignment != null) {
            // Get caregiver name
            if (assignment.getCaregiverId() != null) {
                caregiverName = caregivers.findById(assignment.getCaregiverId())
                        .map(c -> c.getName())
                        .orElse(null);
                
                // Fallback to User table if not in Caregiver table
                if (caregiverName == null) {
                    caregiverName = users.findById(assignment.getCaregiverId())
                            .map(u -> u.getName())
                            .orElse("Unknown Caregiver");
                }
            }
            
            // Get client name
            if (assignment.getClientId() != null) {
                clientName = users.findById(assignment.getClientId())
                        .map(u -> u.getName())
                        .orElse("Unknown Client");
            }
        }
        
        List<Task> taskList = tasks.findByAssignmentIdOrderByCreatedAtAsc(assignmentId);
        List<PaymentLedger> ledgerList = ledger.findByAssignmentIdOrderByCreatedAtAsc(assignmentId);
        
        // Attach proofs to each task
        List<Map<String, Object>> tasksWithProofs = taskList.stream()
                .map(task -> {
                    Map<String, Object> taskMap = new HashMap<>();
                    taskMap.put("id", task.getId());
                    taskMap.put("assignmentId", task.getAssignmentId());
                    taskMap.put("title", task.getTitle());
                    taskMap.put("description", task.getDescription());
                    taskMap.put("status", task.getStatus());
                    taskMap.put("dueAt", task.getDueAt());
                    taskMap.put("createdBy", task.getCreatedBy());
                    taskMap.put("createdAt", task.getCreatedAt());
                    taskMap.put("updatedAt", task.getUpdatedAt());
                    taskMap.put("proofs", proofs.findByTaskIdOrderByUploadedAtDesc(task.getId()));
                    return taskMap;
                })
                .toList();

        long total = taskList.size();
        long verified = taskList.stream().filter(t -> t.getStatus() == TaskStatus.VERIFIED || t.getStatus() == TaskStatus.LOCKED).count();
        long completed = taskList.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED || t.getStatus() == TaskStatus.VERIFIED || t.getStatus() == TaskStatus.LOCKED).count();
        long awaitingProof = taskList.stream().filter(t -> t.getStatus() == TaskStatus.AWAITING_PROOF).count();
        int progress = total == 0 ? 0 : (int) ((verified * 100) / total);

        long accrual = ledgerList.stream()
                .filter(l -> l.getEntryType() == PaymentLedger.EntryType.ACCRUAL || l.getEntryType() == PaymentLedger.EntryType.ADJUSTMENT)
                .mapToLong(l -> Optional.ofNullable(l.getAmountCents()).orElse(0L))
                .sum();
        long payments = ledgerList.stream()
                .filter(l -> l.getEntryType() == PaymentLedger.EntryType.PAYMENT)
                .mapToLong(l -> Optional.ofNullable(l.getAmountCents()).orElse(0L))
                .sum();
        long runningDueCents = Math.max(0, accrual - payments);

        Map<String, Object> result = new HashMap<>();
        result.put("assignment", assignment);
        result.put("caregiverName", caregiverName);
        result.put("clientName", clientName);
        result.put("tasks", tasksWithProofs);
        result.put("ledger", ledgerList);
        result.put("counts", Map.of(
                "total", total,
                "awaitingProof", awaitingProof,
                "completed", completed,
                "verified", verified
        ));
        result.put("progressPercent", progress);
        result.put("runningDueCents", runningDueCents);
        
        return result;
    }
}