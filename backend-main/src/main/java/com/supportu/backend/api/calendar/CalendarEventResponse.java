package com.supportu.backend.api.calendar;

import com.supportu.backend.domain.calendar.UserCalendarEvent;
import com.supportu.backend.domain.policy.Policy;

import java.time.LocalDateTime;

public record CalendarEventResponse(
        Long cid,
        String policyId,
        String title,
        String org,
        String category,
        String applyStatus,
        LocalDateTime eventStartAt,
        LocalDateTime eventEndAt,
        LocalDateTime reminderAt,
        String googleEventId,
        String googleEventLink
) {
    public static CalendarEventResponse from(UserCalendarEvent event, Policy policy) {
        return new CalendarEventResponse(
                event.getCid(),
                event.getPolicyId(),
                policy == null ? "정책 정보 없음" : firstNonBlank(policy.getTitle(), policy.getPolicyTitle()),
                policy == null ? "기관 정보 없음" : firstNonBlank(policy.getSourceName(), "지원기관 미상"),
                policy == null ? "기타" : toKoreanCategory(policy.getCategory()),
                firstNonBlank(event.getApplyStatus(), "pending"),
                event.getEventStartAt(),
                event.getEventEndAt(),
                event.getReminderAt(),
                event.getGid(),
                event.getElink()
        );
    }

    private static String toKoreanCategory(String category) {
        String value = category == null ? "" : category;

        if (value.contains("주거")) {
            return "주거";
        }

        if (value.contains("일자리") || value.contains("취업") || value.contains("창업")) {
            return "일자리";
        }

        if (value.contains("복지") || value.contains("금융") || value.contains("건강")) {
            return "복지";
        }

        return firstNonBlank(category, "기타");
    }

    private static String firstNonBlank(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }

        return value;
    }
}