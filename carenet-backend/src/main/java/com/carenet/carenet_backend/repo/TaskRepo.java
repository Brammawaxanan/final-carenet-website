package com.carenet.carenet_backend.repo;

import com.carenet.carenet_backend.domain.Task;
import com.carenet.carenet_backend.domain.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepo extends JpaRepository<Task, Long> {
    // custom finder
    List<Task> findByAssignmentId(Long assignmentId);
    List<Task> findByAssignmentIdOrderByCreatedAtAsc(Long assignmentId);
    List<Task> findByAssignmentIdAndStatus(Long assignmentId, TaskStatus status);
    long countByAssignmentIdAndStatus(Long assignmentId, TaskStatus status);
    long countByAssignmentId(Long assignmentId);
}