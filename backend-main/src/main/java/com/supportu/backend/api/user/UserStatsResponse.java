package com.supportu.backend.api.user;

public record UserStatsResponse(
        long recommendedCount,
        long bookmarkedCount,
        long calendarEventCount,
        long needApplyCount,
        long appliedCount,
        long waitingResultCount,
        long benefitedCount
) {
}