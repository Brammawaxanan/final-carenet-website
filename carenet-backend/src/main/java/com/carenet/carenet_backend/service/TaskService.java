package com.carenet.carenet_backend.service;

import com.carenet.carenet_backend.domain.*;
import com.carenet.carenet_backend.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepo tasks;
    private final TaskProofRepo proofs;

    public List<Task> listTasks(Long assignmentId) {
        return tasks.findByAssignmentIdOrderByCreatedAtAsc(assignmentId);
    }

    public Task create(Task t) {
        return tasks.save(t);
    }

    public TaskProof uploadProof(TaskProof proof) {
        TaskProof saved = proofs.save(proof);
        // When caregiver uploads proof, mark task as AWAITING_PROOF (not COMPLETED)
        // Client must verify the proof to mark it VERIFIED
        tasks.findById(proof.getTaskId()).ifPresent(task -> {
            if (task.getStatus() == TaskStatus.DRAFT) {
                // Change to AWAITING_PROOF so client knows proof is ready to review
                task.setStatus(TaskStatus.AWAITING_PROOF);
                task.setUpdatedAt(java.time.Instant.now());
                tasks.save(task);
            }
            // If already AWAITING_PROOF or COMPLETED, just update the proof, don't change status
        });
        return saved;
    }

    public Optional<Task> update(Long id, Task updated) {
        return tasks.findById(id).map(existing -> {
            existing.setTitle(updated.getTitle());
            existing.setDescription(updated.getDescription());
            existing.setDueAt(updated.getDueAt());
            existing.setStatus(updated.getStatus());
            existing.setUpdatedAt(java.time.Instant.now());
            return tasks.save(existing);
        });
    }

    public void delete(Long id) {
        tasks.deleteById(id);
    }

    public Optional<Task> markCompleted(Long id) {
        return tasks.findById(id).map(t -> {
            t.setStatus(TaskStatus.COMPLETED);
            t.setUpdatedAt(java.time.Instant.now());
            return tasks.save(t);
        });
    }

    // Client verifies the proof - task is marked VERIFIED
    public Optional<Task> verify(Long id) {
        return tasks.findById(id).map(t -> {
            // Only verify if proof has been submitted
            if (t.getStatus() == TaskStatus.AWAITING_PROOF || t.getStatus() == TaskStatus.COMPLETED) {
                t.setStatus(TaskStatus.VERIFIED);
                t.setUpdatedAt(java.time.Instant.now());
                return tasks.save(t);
            }
            return t; // Return unchanged if not ready for verification
        });
    }
}