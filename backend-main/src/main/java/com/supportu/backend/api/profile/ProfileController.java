package com.supportu.backend.api.profile;

import com.supportu.backend.domain.user.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(
            @AuthenticationPrincipal OAuth2User oauth2User
    ) {
        return ResponseEntity.ok(profileService.getMyProfile(oauth2User));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            @AuthenticationPrincipal OAuth2User oauth2User,
            @RequestBody ProfileRequest request
    ) {
        return ResponseEntity.ok(profileService.updateMyProfile(oauth2User, request));
    }
}