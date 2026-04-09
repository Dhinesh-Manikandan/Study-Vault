package com.studyvault.service;

import java.util.Map;
import java.util.UUID;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.studyvault.entity.AppUser;
import com.studyvault.repository.UserRepository;
import com.studyvault.security.JwtUtil;

@Service
public class AuthService {

    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private AccountService accountService;

    @Transactional
    public Map<String, Object> signUp(String username, String password) {
        String normalizedUsername = normalize(username);
        String normalizedPassword = normalize(password);

        if (normalizedUsername.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }
        if (normalizedPassword.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters");
        }
        if (userRepo.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this username already exists");
        }

        AppUser user = new AppUser();
        user.setId(UUID.randomUUID().toString());
        user.setUsername(normalizedUsername);
        user.setDisplayName(normalizedUsername);
        user.setPasswordHash(passwordEncoder.encode(normalizedPassword));
        userRepo.save(user);

        return buildAuthResponse(user);
    }

    @Transactional
    public Map<String, Object> signIn(String username, String password) {
        String normalizedUsername = normalize(username);
        String normalizedPassword = normalize(password);

        AppUser user = userRepo.findByUsernameIgnoreCase(normalizedUsername)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        if (!passwordEncoder.matches(normalizedPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        return buildAuthResponse(user);
    }

    public Map<String, Object> me(String userId) {
        AppUser user = userRepo.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return buildUserResponse(user);
    }

    @Transactional
    public Map<String, Object> updateCredentials(String userId, String username, String currentPassword, String newPassword) {
        AppUser user = userRepo.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String normalizedCurrentPassword = normalize(currentPassword);
        if (normalizedCurrentPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is required");
        }
        if (!passwordEncoder.matches(normalizedCurrentPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        String existingUsername = normalize(user.getUsername());
        String normalizedUsername = normalize(username);
        String normalizedNewPassword = normalize(newPassword);

        boolean changed = false;

        if (!normalizedUsername.isBlank() && !normalizedUsername.equalsIgnoreCase(existingUsername)) {
            if (userRepo.existsByUsernameIgnoreCase(normalizedUsername)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this username already exists");
            }
            user.setUsername(normalizedUsername);
            user.setDisplayName(normalizedUsername);
            changed = true;
        }

        if (!normalizedNewPassword.isBlank()) {
            if (normalizedNewPassword.length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 6 characters");
            }
            user.setPasswordHash(passwordEncoder.encode(normalizedNewPassword));
            changed = true;
        }

        if (!changed) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No credential changes provided");
        }

        userRepo.save(user);
        return buildAuthResponse(user);
    }

    @Transactional
    public void deleteAccount(String userId) {
        accountService.deleteUserData(userId);
        userRepo.deleteById(userId);
    }

    @Transactional
    public void seedUserIfMissing(String userId, String username, String password) {
        String normalizedUsername = normalize(username);
        String normalizedPassword = normalize(password);
        if (normalizedUsername.isBlank() || normalizedPassword.isBlank()) {
            return;
        }

        if (userRepo.existsById(userId) || userRepo.existsByUsernameIgnoreCase(normalizedUsername)) {
            return;
        }

        AppUser user = new AppUser();
        user.setId(userId);
        user.setUsername(normalizedUsername);
        user.setDisplayName(normalizedUsername);
        user.setPasswordHash(passwordEncoder.encode(normalizedPassword));
        userRepo.save(user);
    }

    private Map<String, Object> buildAuthResponse(AppUser user) {
        String safeUsername = normalize(user.getUsername());
        if (safeUsername.isBlank()) {
            safeUsername = normalize(user.getDisplayName());
        }
        if (safeUsername.isBlank()) {
            safeUsername = user.getId();
        }

        return Map.of(
            "token", jwtUtil.generateToken(user.getId(), safeUsername),
            "user", buildUserResponse(user)
        );
    }

    private Map<String, Object> buildUserResponse(AppUser user) {
        String safeUsername = normalize(user.getUsername());
        String safeDisplayName = normalize(user.getDisplayName());

        if (safeUsername.isBlank()) {
            safeUsername = safeDisplayName;
        }
        if (safeDisplayName.isBlank()) {
            safeDisplayName = safeUsername;
        }
        if (safeUsername.isBlank()) {
            safeUsername = user.getId();
        }
        if (safeDisplayName.isBlank()) {
            safeDisplayName = safeUsername;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", user.getId());
        payload.put("username", safeUsername);
        payload.put("email", safeUsername);
        payload.put("displayName", safeDisplayName);
        return payload;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
