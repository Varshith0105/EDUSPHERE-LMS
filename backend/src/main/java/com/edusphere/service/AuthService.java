package com.edusphere.service;

import com.edusphere.dto.AuthDto.*;
import com.edusphere.exception.BadRequestException;
import com.edusphere.exception.ResourceNotFoundException;
import com.edusphere.model.Role;
import com.edusphere.model.User;
import com.edusphere.repository.RoleRepository;
import com.edusphere.repository.UserRepository;
import com.edusphere.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Transactional
    public AuthResponse authenticateUser(LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Update streak counter and last login date
        updateStreak(user);

        return AuthResponse.builder()
                .token(jwt)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .profilePictureUrl(user.getProfilePictureUrl())
                .xpPoints(user.getXpPoints())
                .streakCount(user.getStreakCount())
                .build();
    }

    @Transactional
    public UserResponse registerUser(RegisterRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            throw new BadRequestException("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new BadRequestException("Error: Email is already in use!");
        }

        String roleName = "ROLE_" + signUpRequest.getRole().toUpperCase();
        Role userRole = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Error: Role " + roleName + " is not found."));

        String profilePic = signUpRequest.getProfilePictureUrl();
        if (profilePic == null || profilePic.isEmpty()) {
            profilePic = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + signUpRequest.getUsername();
        }

        User user = User.builder()
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .firstName(signUpRequest.getFirstName())
                .lastName(signUpRequest.getLastName())
                .profilePictureUrl(profilePic)
                .role(userRole)
                .isVerified(true)
                .xpPoints(0)
                .streakCount(1)
                .lastLoginDate(LocalDateTime.now())
                .build();

        userRepository.save(user);
        return convertToResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, RegisterRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email is already in use!");
            }
            user.setEmail(request.getEmail());
        }

        userRepository.save(user);
        return convertToResponse(user);
    }

    @Transactional
    public void addXp(User user, int xp) {
        user.setXpPoints(user.getXpPoints() + xp);
        userRepository.save(user);
    }

    private void updateStreak(User user) {
        LocalDateTime now = LocalDateTime.now();
        if (user.getLastLoginDate() != null) {
            LocalDateTime lastLogin = user.getLastLoginDate();
            if (lastLogin.toLocalDate().isBefore(now.toLocalDate())) {
                if (lastLogin.toLocalDate().isEqual(now.toLocalDate().minusDays(1))) {
                    user.setStreakCount(user.getStreakCount() + 1);
                } else {
                    user.setStreakCount(1); // Streak broken
                }
            }
        } else {
            user.setStreakCount(1);
        }
        user.setLastLoginDate(now);
        userRepository.save(user);
    }

    public UserResponse convertToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().getName())
                .profilePictureUrl(user.getProfilePictureUrl())
                .xpPoints(user.getXpPoints())
                .streakCount(user.getStreakCount())
                .build();
    }

    public AuthResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return AuthResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .profilePictureUrl(user.getProfilePictureUrl())
                .xpPoints(user.getXpPoints())
                .streakCount(user.getStreakCount())
                .build();
    }
}
