package com.studyvault.controller;

import com.studyvault.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired ItemService itemService;

    @GetMapping
    public ResponseEntity<?> getStats(Authentication auth) {
        return ResponseEntity.ok(itemService.getStats(auth.getName()));
    }
}