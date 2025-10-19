package com.carenet.carenet_backend.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for displaying user/caregiver profile information with premium status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDisplay {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String avatar; // Initials for avatar display (e.g., "JD" for John Doe)
    private Boolean isPremium; // Premium subscription status
    private Boolean isSubscribed; // Alias for isPremium
    
    /**
     * Generate avatar initials from name
     */
    public static String getInitials(String name) {
        if (name == null || name.isBlank()) {
            return "??";
        }
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return (parts[0].charAt(0) + "" + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
}
