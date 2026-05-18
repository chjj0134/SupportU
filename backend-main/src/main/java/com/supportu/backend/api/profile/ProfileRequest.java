package com.supportu.backend.api.profile;

public record ProfileRequest(
        Integer age,
        String gender,
        String city,
        String scity,
        String education,
        String employment,
        Boolean disability,
        Long incomeInteger,
        String asset,
        String[] preferredCategories
) {
}