package com.studyvault.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.studyvault.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(authService.signUp(body.get("username"), body.get("password")));
        } catch (ResponseStatusException ex) {
            String message = ex.getReason() != null ? ex.getReason() : "Failed to sign up";
            return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> signIn(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(authService.signIn(body.get("username"), body.get("password")));
        } catch (ResponseStatusException ex) {
            String message = ex.getReason() != null ? ex.getReason() : "Failed to sign in";
            return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        return ResponseEntity.ok(authService.me(auth.getName()));
    }

    @PatchMapping("/me")
    public ResponseEntity<?> updateCredentials(Authentication auth, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(authService.updateCredentials(
                auth.getName(),
                body.get("username"),
                body.get("currentPassword"),
                body.get("newPassword")
            ));
        } catch (ResponseStatusException ex) {
            String message = ex.getReason() != null ? ex.getReason() : "Failed to update credentials";
            return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Unexpected error while updating credentials";
            return ResponseEntity.internalServerError().body(Map.of("message", message));
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteAccount(Authentication auth) {
        authService.deleteAccount(auth.getName());
        return ResponseEntity.ok(Map.of("message", "Account deleted"));
    }
}
