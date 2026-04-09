package com.studyvault.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.studyvault.service.AuthService;

@Configuration
public class AuthSeedConfig {

    @Bean
    @SuppressWarnings("unused")
    public CommandLineRunner seedAuthUser(
        AuthService authService,
        @Value("${app.auth.seed-enabled:true}") boolean seedEnabled,
        @Value("${app.auth.seed-user-id:dev-user}") String seedUserId,
        @Value("${app.auth.seed-username:}") String seedUsername,
        @Value("${app.auth.seed-password:}") String seedPassword
    ) {
        return args -> {
            if (seedEnabled) {
                authService.seedUserIfMissing(seedUserId, seedUsername, seedPassword);
            }
        };
    }
}
