package com.supportu.backend.api.policy;

import com.supportu.backend.domain.policy.Policy;
import com.supportu.backend.domain.policy.PolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/policies")
@RequiredArgsConstructor
public class PolicyController {

    private final PolicyRepository policyRepository;

    @GetMapping("/recommended")
    public List<PolicyResponse> getRecommendedPolicies() {
        return policyRepository.findAll().stream()
                .sorted(Comparator.comparing(policy -> policy.getPend() == null))
                .limit(3)
                .map(PolicyResponse::from)
                .toList();
    }

    @GetMapping
    public List<PolicyResponse> getPolicies() {
        return policyRepository.findAll().stream()
                .map(PolicyResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public PolicyDetailResponse getPolicyDetail(@PathVariable String id) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "정책을 찾을 수 없습니다."));

        return PolicyDetailResponse.from(policy);
    }
}