package com.carenet.carenet_backend.repo;

import com.carenet.carenet_backend.domain.TaskProof;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskProofRepo extends JpaRepository<TaskProof, Long> {
    List<TaskProof> findByTaskId(Long taskId);
    List<TaskProof> findByTaskIdOrderByUploadedAtDesc(Long taskId);
}