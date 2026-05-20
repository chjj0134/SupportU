package com.supportu.backend.api.policy;

import com.supportu.backend.domain.policy.Policy;

public record ScrappedPolicyResponse(
        String id,
        String title,
        String category,
        String deadline,
        String support,
        String org,
        String amount,
        String scope,
        String duration,
        String target,
        String method
) {
    public static ScrappedPolicyResponse from(Policy policy) {
        return new ScrappedPolicyResponse(
                policy.getPolicyId(),
                firstNonBlank(policy.getTitle(), policy.getPolicyTitle()),
                toKoreanCategory(policy.getCategory()),
                PolicyResponse.from(policy, true).deadline(),
                firstNonBlank(policy.getSupportContent(), "지원내용 확인 필요"),
                firstNonBlank(policy.getSourceName(), "지원기관 미상"),
                firstNonBlank(policy.getSupportContent(), "지원금 확인 필요"),
                firstNonBlank(policy.getSupportContent(), "지원 범위 확인 필요"),
                "공고문 확인 필요",
                firstNonBlank(policy.getEligibility(), "지원 대상 확인 필요"),
                firstNonBlank(policy.getApplicationMethod(), "신청 방법 확인 필요")
        );
    }

    private static String toKoreanCategory(String category) {
        String value = category == null ? "" : category;

        if (value.contains("주거")) return "주거";
        if (value.contains("일자리") || value.contains("취업") || value.contains("창업")) return "일자리";
        if (value.contains("복지") || value.contains("금융") || value.contains("건강")) return "복지";

        return "복지";
    }

    private static String firstNonBlank(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }

        return value;
    }
}