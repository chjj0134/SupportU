package com.supportu.backend.api.benefit;

import java.util.List;

public record BenefitSummaryResponse(
        Long totalBenefitAmount,
        String benefitPeriodText,
        List<ServiceBenefitResponse> serviceBenefits
) {
}