package com.carenet.carenet_backend;

// imports intentionally minimal for this integration test
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class AuthOtpIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    // Repos are available if needed for deeper assertions; keep autowired for now
    // No direct repo usage required for this integration test

    @Test
    @SuppressWarnings({"unchecked"})
    public void testRegisterSendVerifyLogin() throws Exception {
    // Register using a unique email to avoid collisions in repeated runs
    String uniqueEmail = "otp-test+" + System.currentTimeMillis() + "@example.com";
    // Register
    Map<String, Object> register = Map.of(
        "name", "Test User",
        "email", uniqueEmail,
        "password", "Password123",
        "phone", "1234567890",
        "address", "Somewhere",
        "city", "City",
        "state", "ST",
        "zipCode", "00000",
        "role", "CLIENT"
    );

    ResponseEntity<?> regResp = restTemplate.postForEntity("/auth/register", register, java.util.Map.class);
    assertThat(regResp.getStatusCode().is2xxSuccessful()).isTrue();

        // Send OTP
    ResponseEntity<?> sendResp = restTemplate.postForEntity("/auth/send-otp", java.util.Map.of("email", uniqueEmail), java.util.Map.class);
    assertThat(sendResp.getStatusCode().is2xxSuccessful()).isTrue();
    java.util.Map<String,Object> body = (java.util.Map<String,Object>) sendResp.getBody();
    assertThat(body).isNotNull();
    // The controller returns code in dev for testing
    String code = (String) body.get("code");
    assertThat(code).isNotBlank();

        // Verify
    ResponseEntity<?> verifyResp = restTemplate.postForEntity("/auth/verify-otp", java.util.Map.of("email", uniqueEmail, "code", code), java.util.Map.class);
    assertThat(verifyResp.getStatusCode().is2xxSuccessful()).isTrue();
    java.util.Map<String,Object> vbody = (java.util.Map<String,Object>) verifyResp.getBody();
    assertThat(vbody).isNotNull();
    assertThat(vbody.get("verified")).isEqualTo(Boolean.TRUE);

        // Login
    ResponseEntity<?> loginResp = restTemplate.postForEntity("/auth/login", java.util.Map.of("email", uniqueEmail, "password", "Password123"), java.util.Map.class);
    assertThat(loginResp.getStatusCode().is2xxSuccessful()).isTrue();
    java.util.Map<String,Object> lbody = (java.util.Map<String,Object>) loginResp.getBody();
    assertThat(lbody).isNotNull();
    assertThat(lbody.get("token")).isNotNull();
    }
}
