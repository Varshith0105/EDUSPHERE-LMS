package com.edusphere.dto;

import lombok.*;

public class AuthDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequest {
        private String username;
        private String password;
        private boolean rememberMe;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;
        private String firstName;
        private String lastName;
        private String role; // STUDENT or INSTRUCTOR
        private String profilePictureUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthResponse {
        private String token;
        private String username;
        private String role;
        private Long userId;
        private String email;
        private String profilePictureUrl;
        private Integer xpPoints;
        private Integer streakCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserResponse {
        private Long id;
        private String username;
        private String email;
        private String firstName;
        private String lastName;
        private String role;
        private String profilePictureUrl;
        private Integer xpPoints;
        private Integer streakCount;
    }
}
