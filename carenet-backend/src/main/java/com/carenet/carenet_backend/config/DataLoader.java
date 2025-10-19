package com.carenet.carenet_backend.config;

import com.carenet.carenet_backend.domain.*;
import com.carenet.carenet_backend.repo.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Instant;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner loadDemoData(
            UserRepo users,
            CaregiverRepo caregivers,
            SubscriptionRepo subscriptions,
            AssignmentRepo assignments,
            TaskRepo tasks,
            PaymentLedgerRepo ledger
    ) {
        return args -> {
            // Create minimal test data if database is empty
            if (users.count() == 0) {
                System.out.println("Creating test data for development...");
                
                // Create test users
                User client = new User();
                client.setName("Alice Johnson");
                client.setEmail("alice@test.com");
                client.setPasswordHash("password123");
                client.setRole(User.Role.CLIENT);
                client = users.save(client);
                
                User caregiverUser = new User();
                caregiverUser.setName("Bob Caregiver");
                caregiverUser.setEmail("bob@caregiver.com");
                caregiverUser.setPasswordHash("password123");
                caregiverUser.setRole(User.Role.CAREGIVER);
                caregiverUser = users.save(caregiverUser);
                
                // Create test caregiver profile
                Caregiver caregiver = new Caregiver();
                caregiver.setUserId(caregiverUser.getId());
                caregiver.setName("Bob Caregiver");
                caregiver.setServiceTypes("elderly,medical");
                caregiver.setSkills("Elderly Care,Medical");
                caregiver.setHourlyRateCents(2500); // $25/hour
                caregiver.setRating(4.8);
                caregiver.setReviewCount(24);
                caregiver.setExperience(5);
                caregiver.setLat(12.9716);
                caregiver.setLng(77.5946);
                caregiver.setBio("Experienced elderly care specialist");
                caregiver.setVerified(true);
                caregiver = caregivers.save(caregiver);
                
                // Create test subscription
                Subscription subscription = new Subscription();
                subscription.setUserId(client.getId());
                subscription.setTier("PREMIUM");
                subscription.setStartDate(Instant.now());
                subscription.setEndDate(Instant.now().plusSeconds(365L * 24 * 3600));
                subscription.setActive(true);
                subscription.setCreatedAt(Instant.now());
                subscriptions.save(subscription);
                
                // Create test assignment
                Assignment assignment = new Assignment();
                assignment.setClientId(client.getId());
                assignment.setCaregiverId(caregiver.getId());
                assignment.setServiceType("Elderly Care");
                assignment.setServiceRequestId(1001L);
                assignment.setActive(true);
                assignment.setStatus(AssignmentStatus.IN_PROGRESS);
                assignment.setScheduledAt(Instant.now());
                assignment.setCreatedAt(Instant.now());
                assignment = assignments.save(assignment);
                
                // Create test tasks
                Task task1 = new Task();
                task1.setAssignmentId(assignment.getId());
                task1.setTitle("Morning Medication");
                task1.setDescription("Give medication at 9 AM");
                task1.setStatus(TaskStatus.VERIFIED);
                task1.setDueAt(Instant.now().minusSeconds(86400));
                task1.setCreatedBy("CLIENT");
                task1.setCreatedAt(Instant.now().minusSeconds(86400));
                task1.setUpdatedAt(Instant.now().minusSeconds(86400));
                tasks.save(task1);
                
                Task task2 = new Task();
                task2.setAssignmentId(assignment.getId());
                task2.setTitle("Blood Pressure Check");
                task2.setDescription("Check and record blood pressure");
                task2.setStatus(TaskStatus.COMPLETED);
                task2.setDueAt(Instant.now().minusSeconds(3600));
                task2.setCreatedBy("CLIENT");
                task2.setCreatedAt(Instant.now().minusSeconds(3600));
                task2.setUpdatedAt(Instant.now().minusSeconds(3600));
                tasks.save(task2);
                
                Task task3 = new Task();
                task3.setAssignmentId(assignment.getId());
                task3.setTitle("Lunch Preparation");
                task3.setDescription("Prepare healthy lunch");
                task3.setStatus(TaskStatus.AWAITING_PROOF);
                task3.setDueAt(Instant.now().plusSeconds(1800));
                task3.setCreatedBy("CLIENT");
                task3.setCreatedAt(Instant.now());
                task3.setUpdatedAt(Instant.now());
                tasks.save(task3);
                
                // Create payment ledger entries
                PaymentLedger payment1 = new PaymentLedger();
                payment1.setUserId(client.getId());
                payment1.setAssignmentId(assignment.getId());
                payment1.setEntryType(PaymentLedger.EntryType.PAYMENT);
                payment1.setAmountCents(15000L); // $150
                payment1.setNote("Payment for morning medication task");
                payment1.setCreatedAt(Instant.now().minusSeconds(86400));
                ledger.save(payment1);
                
                PaymentLedger payment2 = new PaymentLedger();
                payment2.setUserId(client.getId());
                payment2.setAssignmentId(assignment.getId());
                payment2.setEntryType(PaymentLedger.EntryType.ACCRUAL);
                payment2.setAmountCents(8750L); // $87.50
                payment2.setNote("Accrued charges for mobility assistance");
                payment2.setCreatedAt(Instant.now().minusSeconds(1800));
                ledger.save(payment2);
                
                // Create additional caregivers for better testing
                User caregiver2User = new User();
                caregiver2User.setName("Sarah Williams");
                caregiver2User.setEmail("sarah@caregiver.com");
                caregiver2User.setPasswordHash("password123");
                caregiver2User.setRole(User.Role.CAREGIVER);
                caregiver2User = users.save(caregiver2User);
                
                Caregiver caregiver2 = new Caregiver();
                caregiver2.setUserId(caregiver2User.getId());
                caregiver2.setName("Sarah Williams");
                caregiver2.setServiceTypes("childcare,home");
                caregiver2.setSkills("Childcare,Home Care,Companionship");
                caregiver2.setHourlyRateCents(3500); // $35/hour
                caregiver2.setRating(4.9);
                caregiver2.setReviewCount(32);
                caregiver2.setExperience(8);
                caregiver2.setLat(12.9352);
                caregiver2.setLng(77.6245);
                caregiver2.setBio("Experienced childcare specialist with 8+ years of experience");
                caregiver2.setVerified(true);
                caregivers.save(caregiver2);
                
                User caregiver3User = new User();
                caregiver3User.setName("Michael Chen");
                caregiver3User.setEmail("michael@caregiver.com");
                caregiver3User.setPasswordHash("password123");
                caregiver3User.setRole(User.Role.CAREGIVER);
                caregiver3User = users.save(caregiver3User);
                
                Caregiver caregiver3 = new Caregiver();
                caregiver3.setUserId(caregiver3User.getId());
                caregiver3.setName("Michael Chen");
                caregiver3.setServiceTypes("medical,disability");
                caregiver3.setSkills("Medical Care,Disability Support,Physical Therapy");
                caregiver3.setHourlyRateCents(4500); // $45/hour
                caregiver3.setRating(4.7);
                caregiver3.setReviewCount(18);
                caregiver3.setExperience(12);
                caregiver3.setLat(12.9698);
                caregiver3.setLng(77.7500);
                caregiver3.setBio("Medical care specialist with nursing background");
                caregiver3.setVerified(true);
                caregivers.save(caregiver3);
                
                System.out.println("Test data created successfully!");
                System.out.println("Test user: alice@test.com / password123 (PREMIUM)");
                System.out.println("Test caregivers: bob@caregiver.com, sarah@caregiver.com, michael@caregiver.com / password123");
                System.out.println("Assignment ID: " + assignment.getId() + " for testing activity pages");
            }
        };
    }
}
