package com.studyvault.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.studyvault.entity.AppUser;

public interface UserRepository extends JpaRepository<AppUser, String> {
    Optional<AppUser> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);
}
