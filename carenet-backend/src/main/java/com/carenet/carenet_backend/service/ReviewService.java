package com.carenet.carenet_backend.service;

import com.carenet.carenet_backend.domain.Assignment;
import com.carenet.carenet_backend.domain.Caregiver;
import com.carenet.carenet_backend.domain.Review;
import com.carenet.carenet_backend.repo.AssignmentRepo;
import com.carenet.carenet_backend.repo.CaregiverRepo;
import com.carenet.carenet_backend.repo.ReviewRepo;
import com.carenet.carenet_backend.repo.TaskRepo;
import com.carenet.carenet_backend.domain.TaskStatus;
import org.springframework.stereotype.Service;

import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {
    private final ReviewRepo reviewRepo;
    private final AssignmentRepo assignmentRepo;
    private final CaregiverRepo caregiverRepo;
    private final TaskRepo taskRepo;
    private final com.carenet.carenet_backend.repo.UserRepo userRepo;

    public ReviewService(ReviewRepo reviewRepo, AssignmentRepo assignmentRepo, CaregiverRepo caregiverRepo, TaskRepo taskRepo, com.carenet.carenet_backend.repo.UserRepo userRepo) {
        this.reviewRepo = reviewRepo;
        this.assignmentRepo = assignmentRepo;
        this.caregiverRepo = caregiverRepo;
        this.taskRepo = taskRepo;
        this.userRepo = userRepo;
    }

    public Review createReview(Review review) {
        // check if already exists for assignment and user
        Optional<Review> existing = reviewRepo.findByAssignmentIdAndUserId(review.getAssignmentId(), review.getUserId());
        if (existing.isPresent()) {
            throw new IllegalStateException("Review already exists for this assignment by the user");
        }

        // verify assignment exists and was completed and belongs to the user
        Assignment assignment = assignmentRepo.findById(review.getAssignmentId())
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));
        // Allow review if assignment completed OR all tasks have been VERIFIED
        boolean allTasksVerified = false;
        long totalTasks = taskRepo.countByAssignmentId(assignment.getId());
        if (totalTasks > 0) {
            long verified = taskRepo.countByAssignmentIdAndStatus(assignment.getId(), TaskStatus.VERIFIED);
            allTasksVerified = (verified == totalTasks);
        }
        if (assignment.getCompletedAt() == null && !allTasksVerified) {
            throw new IllegalStateException("Cannot review an assignment that is not completed or fully verified");
        }
        if (!assignment.getClientId().equals(review.getUserId())) {
            throw new SecurityException("Only the client who received the service can review it");
        }

        Review saved = reviewRepo.save(review);
        // update caregiver aggregates
        recalcCaregiverRating(assignment.getCaregiverId());
        return saved;
    }

    public List<Review> getReviewsForUser(Long userId) {
        if (userId == null) {
            return reviewRepo.findAll();
        }
        return reviewRepo.findByUserId(userId);
    }

    public Optional<Review> getReview(Long id) {
        return reviewRepo.findById(id);
    }

    public Review updateReview(Long id, Long actingUserId, Review updated) {
        Review r = reviewRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Review not found"));
        // allow update by author or admin
        boolean isAuthor = r.getUserId().equals(actingUserId);
        boolean isAdmin = false;
        if (!isAuthor && actingUserId != null) {
            isAdmin = userRepo.findById(actingUserId).map(u -> u.getRole() == com.carenet.carenet_backend.domain.User.Role.ADMIN).orElse(false);
        }
        if (!isAuthor && !isAdmin) {
            throw new SecurityException("Only the author or an admin may update this review");
        }
        // ensure assignment is still completed
        Assignment assignment = assignmentRepo.findById(r.getAssignmentId())
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));
        // Allow update if assignment completed OR all tasks verified
        boolean allTasksVerifiedForUpdate = false;
        long totalTasksForUpdate = taskRepo.countByAssignmentId(assignment.getId());
        if (totalTasksForUpdate > 0) {
            long verifiedForUpdate = taskRepo.countByAssignmentIdAndStatus(assignment.getId(), TaskStatus.VERIFIED);
            allTasksVerifiedForUpdate = (verifiedForUpdate == totalTasksForUpdate);
        }
        if (assignment.getCompletedAt() == null && !allTasksVerifiedForUpdate) {
            throw new IllegalStateException("Cannot update review for an incomplete assignment");
        }

        r.setRating(updated.getRating());
        r.setComment(updated.getComment());
        Review saved = reviewRepo.save(r);
        recalcCaregiverRating(assignment.getCaregiverId());
        return saved;
    }

    public void deleteReview(Long id, Long actingUserId) {
        Review r = reviewRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Review not found"));
        // allow delete by author or admin
        boolean isAuthorDel = r.getUserId().equals(actingUserId);
        boolean isAdminDel = false;
        if (!isAuthorDel && actingUserId != null) {
            isAdminDel = userRepo.findById(actingUserId).map(u -> u.getRole() == com.carenet.carenet_backend.domain.User.Role.ADMIN).orElse(false);
        }
        if (!isAuthorDel && !isAdminDel) {
            throw new SecurityException("Only the author or an admin may delete this review");
        }
    Assignment assignment = assignmentRepo.findById(r.getAssignmentId())
        .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));
    // Allow delete if assignment completed OR all tasks verified
    boolean allTasksVerifiedForDelete = false;
    long totalTasksForDelete = taskRepo.countByAssignmentId(assignment.getId());
    if (totalTasksForDelete > 0) {
        long verifiedForDelete = taskRepo.countByAssignmentIdAndStatus(assignment.getId(), TaskStatus.VERIFIED);
        allTasksVerifiedForDelete = (verifiedForDelete == totalTasksForDelete);
    }
    if (assignment.getCompletedAt() == null && !allTasksVerifiedForDelete) {
        throw new IllegalStateException("Cannot delete review for an incomplete assignment");
    }
    reviewRepo.deleteById(id);
        recalcCaregiverRating(assignment.getCaregiverId());
    }

    private void recalcCaregiverRating(Long caregiverId) {
        if (caregiverId == null) return;
        // Gather all assignments for caregiver, then collect reviews for those assignments
        List<com.carenet.carenet_backend.domain.Assignment> assignments = assignmentRepo.findByCaregiverId(caregiverId);
        List<Review> allReviews = new java.util.ArrayList<>();
        for (com.carenet.carenet_backend.domain.Assignment a : assignments) {
            List<Review> rs = reviewRepo.findByAssignmentId(a.getId());
            if (rs != null && !rs.isEmpty()) allReviews.addAll(rs);
        }

        Optional<Caregiver> cg = caregiverRepo.findById(caregiverId);
        if (allReviews.isEmpty()) {
            cg.ifPresent(c -> { c.setRating(0.0); c.setReviewCount(0); caregiverRepo.save(c); });
            return;
        }
        DoubleSummaryStatistics stats = allReviews.stream().mapToDouble(r -> r.getRating() == null ? 0.0 : r.getRating()).summaryStatistics();
        double avg = stats.getAverage();
        int count = allReviews.size();
        cg.ifPresent(c -> { c.setRating(avg); c.setReviewCount(count); caregiverRepo.save(c); });
    }
}
