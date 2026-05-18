package com.supportu.backend.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, String> {
}