package com.supportu.backend.api.user;

import com.supportu.backend.domain.bookmark.BookmarkRepository;
import com.supportu.backend.domain.calendar.UserCalendarEvent;
import com.supportu.backend.domain.calendar.UserCalendarEventRepository;
import com.supportu.backend.domain.policy.PolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserStatsController {

    private final PolicyRepository policyRepository;
    private final BookmarkRepository bookmarkRepository;
    private final UserCalendarEventRepository calendarEventRepository;

    @GetMapping("/stats")
    public UserStatsResponse getMyStats(
            @AuthenticationPrincipal OAuth2User oauth2User
    ) {
        String uid = getGoogleUid(oauth2User);

        List<UserCalendarEvent> calendarEvents = calendarEventRepository.findByUidOrderByEventStartAtAsc(uid);

        long recommendedCount = policyRepository.count();
        long bookmarkedCount = bookmarkRepository.countByUid(uid);
        long calendarEventCount = calendarEvents.size();
        long needApplyCount = countByStatus(calendarEvents, "pending", "지원 필요");
        long appliedCount = countByStatus(calendarEvents, "applied", "지원 완료");
        long waitingResultCount = countByStatus(calendarEvents, "waiting", "결과 대기");
        long benefitedCount = countByStatus(calendarEvents, "benefited", "수혜 완료");

        return new UserStatsResponse(
                recommendedCount,
                bookmarkedCount,
                calendarEventCount,
                needApplyCount,
                appliedCount,
                waitingResultCount,
                benefitedCount
        );
    }

    private long countByStatus(List<UserCalendarEvent> calendarEvents, String... statuses) {
        return calendarEvents.stream()
                .filter(event -> matchesStatus(event.getApplyStatus(), statuses))
                .count();
    }

    private boolean matchesStatus(String applyStatus, String... statuses) {
        if (applyStatus == null || applyStatus.isBlank()) {
            return false;
        }

        for (String status : statuses) {
            if (status.equalsIgnoreCase(applyStatus)) {
                return true;
            }
        }

        return false;
    }

    private String getGoogleUid(OAuth2User oauth2User) {
        String sub = oauth2User.getAttribute("sub");

        if (sub == null || sub.isBlank()) {
            throw new IllegalArgumentException("Google OAuth sub 값이 없습니다.");
        }

        return sub;
    }
}