package com.supportu.backend.api.profile;

import com.supportu.backend.domain.user.UserProfile;

import java.time.LocalDateTime;

public record ProfileResponse(
        String uid,
        Integer age,
        String gender,
        String city,
        String scity,
        String education,
        String employment,
        Boolean disability,
        Long incomeInteger,
        String asset,
        String[] preferredCategories,
        LocalDateTime createdAt
) {

    public static ProfileResponse from(UserProfile profile) {
        return new ProfileResponse(
                profile.getUid(),
                profile.getAge(),
                profile.getGender(),
                profile.getCity(),
                profile.getScity(),
                profile.getEducation(),
                profile.getEmployment(),
                profile.getDisability(),
                profile.getIncomeInteger(),
                profile.getAsset(),
                profile.getPreferredCategories(),
                profile.getCreatedAt()
        );
    }
}