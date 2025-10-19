package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.domain.Review;
import com.carenet.carenet_backend.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/reviews")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            List<Review> reviews = reviewService.getReviewsForUser(userId);
            return ResponseEntity.ok().body(java.util.Map.of("reviews", reviews));
        }
        // return all reviews if no userId (admin usage) - keep simple
        return ResponseEntity.ok(reviewService.getReviewsForUser(null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return reviewService.getReview(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Review review, @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        // If header user id present, override incoming userId for safety
        if (headerUserId != null) review.setUserId(headerUserId);
        try {
            Review created = reviewService.createReview(review);
            return ResponseEntity.created(URI.create("/reviews/" + created.getId())).body(created);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Review r, @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        try {
            Long actor = headerUserId;
            if (actor == null) actor = r.getUserId();
            Review updated = reviewService.updateReview(id, actor, r);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        try {
            reviewService.deleteReview(id, headerUserId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
