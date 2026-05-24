package com.supportu.backend.api.benefit;

public record ServiceBenefitResponse(
        String benefitType,
        String benefitItem,
        String effectSummary
) {
}