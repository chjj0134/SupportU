package com.supportu.backend.domain.benefit;

import com.supportu.backend.api.benefit.BenefitSummaryResponse;
import com.supportu.backend.api.benefit.ServiceBenefitResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BenefitService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public BenefitSummaryResponse getBenefitSummary(String uid) {
        Long totalBenefitAmount = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(SUM(benefit_amount), 0)
                FROM effect
                WHERE uid = ?
                  AND is_quantifiable = true
                """,
                Long.class,
                uid
        );

        Timestamp firstCreatedAt = jdbcTemplate.queryForObject(
                """
                SELECT MIN(created_at)
                FROM effect
                WHERE uid = ?
                """,
                Timestamp.class,
                uid
        );

        List<ServiceBenefitResponse> serviceBenefits = jdbcTemplate.query(
                """
                SELECT benefit_type, benefit_item, effect_summary
                FROM effect
                WHERE uid = ?
                  AND is_quantifiable = false
                ORDER BY created_at DESC, eid DESC
                """,
                (rs, rowNum) -> new ServiceBenefitResponse(
                        rs.getString("benefit_type"),
                        rs.getString("benefit_item"),
                        rs.getString("effect_summary")
                ),
                uid
        );

        return new BenefitSummaryResponse(
                totalBenefitAmount == null ? 0L : totalBenefitAmount,
                formatBenefitPeriodText(firstCreatedAt),
                serviceBenefits
        );
    }

    private String formatBenefitPeriodText(Timestamp firstCreatedAt) {
        if (firstCreatedAt == null) {
            return "현재 기준";
        }

        LocalDateTime dateTime = firstCreatedAt.toLocalDateTime();
        return dateTime.format(DateTimeFormatter.ofPattern("yyyy.MM")) + " ~ 현재";
    }
}