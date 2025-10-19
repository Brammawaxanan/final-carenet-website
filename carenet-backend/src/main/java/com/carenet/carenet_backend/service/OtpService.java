package com.carenet.carenet_backend.service;

import com.carenet.carenet_backend.domain.OtpCode;
import com.carenet.carenet_backend.repo.OtpCodeRepo;
import com.carenet.carenet_backend.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OtpService {
    private final OtpCodeRepo otpCodeRepo;
    private final EmailService emailService;
    private final UserRepo userRepo;

    @Value("${otp.expiry.minutes:10}")
    private int otpExpiryMinutes;

    private final SecureRandom random = new SecureRandom();

    public String generateAndSendOtp(String email) {
        // Generate 6-digit numeric code
        int code = 100000 + random.nextInt(900000);
        String codeStr = String.valueOf(code);

        // Hash code
        String hash = sha256(codeStr);

        OtpCode otp = new OtpCode();
        otp.setEmail(email);
        otp.setCodeHash(hash);
        otp.setExpiresAt(Instant.now().plus(otpExpiryMinutes, ChronoUnit.MINUTES));
        otp.setUsed(false);
        otp = otpCodeRepo.save(otp);

        // Send email (async)
        String subject = "Your CareNet verification code";
        String body = String.format("Your verification code is %s. It will expire in %d minutes.", codeStr, otpExpiryMinutes);
        emailService.sendSimpleEmail(email, subject, body);

        return codeStr; // For testing purposes; do NOT expose in production endpoints
    }

    public boolean verifyOtp(String email, String code) {
        Optional<OtpCode> found = otpCodeRepo.findTopByEmailAndUsedOrderByExpiresAtDesc(email, false);
        if (found.isEmpty()) return false;
        OtpCode otp = found.get();

        if (otp.isUsed()) return false;
        if (otp.getExpiresAt().isBefore(Instant.now())) return false;

        String incomingHash = sha256(code);
        if (!incomingHash.equals(otp.getCodeHash())) return false;

        otp.setUsed(true);
        otpCodeRepo.save(otp);

        // Mark user as verified if present
        userRepo.findByEmail(email).ifPresent(u -> {
            u.setEmailVerified(true);
            userRepo.save(u);
        });
        return true;
    }

    private String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash OTP", e);
        }
    }
}
