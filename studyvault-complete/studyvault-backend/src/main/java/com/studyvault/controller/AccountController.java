package com.studyvault.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.studyvault.service.AuthService;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    @Autowired private AuthService authService;

    @DeleteMapping
    public ResponseEntity<?> deleteAccount(Authentication auth) {
        authService.deleteAccount(auth.getName());
        return ResponseEntity.ok(Map.of("message", "Account deleted"));
    }
}