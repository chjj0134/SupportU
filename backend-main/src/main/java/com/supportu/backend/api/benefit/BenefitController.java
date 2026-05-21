package com.supportu.backend.api.benefit;

import com.supportu.backend.domain.benefit.BenefitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class BenefitController {

    private final BenefitService benefitService;

    @GetMapping("/{userId}/benefits/summary")
    public ResponseEntity<BenefitSummaryResponse> getBenefitSummary(
            @PathVariable String userId
    ) {
        return ResponseEntity.ok(benefitService.getBenefitSummary(userId));
    }
}