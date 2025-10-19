package com.carenet.carenet_backend.service;

import com.carenet.carenet_backend.domain.Subscription;
import com.carenet.carenet_backend.repo.SubscriptionRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {
    private final SubscriptionRepo subscriptions;

    public boolean isActive(Long userId) {
        return subscriptions.findByUserIdAndActive(userId, true)
                .filter(s -> s.getEndDate() != null && s.getEndDate().isAfter(Instant.now()))
                .isPresent();
    }
    
    /**
     * Get upcoming subscription payments for user
     */
    public List<Map<String, Object>> getUpcomingPayments(Long userId) {
        log.info("Fetching upcoming payments for userId={}", userId);
        
        return subscriptions.findAll().stream()
                .filter(s -> s.getUserId().equals(userId))
                .filter(s -> "ACTIVE".equals(s.getStatus()))
                .filter(s -> s.getNextBillingAt() != null)
                .filter(s -> s.getNextBillingAt().isAfter(Instant.now()))
                .sorted(Comparator.comparing(Subscription::getNextBillingAt))
                .map(sub -> {
                    Map<String, Object> payment = new HashMap<>();
                    payment.put("subscriptionId", sub.getId());
                    payment.put("plan", sub.getTier());
                    payment.put("amount", sub.getAmountCents() / 100.0);
                    payment.put("billingCycle", sub.getBillingCycle());
                    payment.put("nextBillingDate", sub.getNextBillingAt());
                    payment.put("status", sub.getStatus());
                    payment.put("paymentMethod", sub.getPaymentMethod());
                    return payment;
                })
                .collect(Collectors.toList());
    }
}


