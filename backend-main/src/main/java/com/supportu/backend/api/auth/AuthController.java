package com.supportu.backend.api.auth;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    @GetMapping("/")
    public String home() {
        return "SupportU backend is running";
    }

    @GetMapping("/api/auth/success")
    public Map<String, Object> loginSuccess(@AuthenticationPrincipal OAuth2User oauth2User) {
        return Map.of(
                "message", "google login success",
                "name", oauth2User.getAttribute("name"),
                "email", oauth2User.getAttribute("email"),
                "attributes", oauth2User.getAttributes()
        );
    }
}