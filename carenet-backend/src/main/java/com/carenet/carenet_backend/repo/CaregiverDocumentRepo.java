package com.carenet.carenet_backend.repo;

import com.carenet.carenet_backend.domain.CaregiverDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CaregiverDocumentRepo extends JpaRepository<CaregiverDocument, Long> {
    List<CaregiverDocument> findByCaregiverId(Long caregiverId);
}
