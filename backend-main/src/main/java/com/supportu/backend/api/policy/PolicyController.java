package com.supportu.backend.api.policy;

import com.supportu.backend.domain.bookmark.Bookmark;
import com.supportu.backend.domain.bookmark.BookmarkRepository;
import com.supportu.backend.domain.policy.Policy;
import com.supportu.backend.domain.policy.PolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
    private final BookmarkRepository bookmarkRepository;

    @GetMapping("/recommended")
    public List<PolicyResponse> getRecommendedPolicies() {
        return policyRepository.findAll().stream()
                .sorted(Comparator.comparing(policy -> policy.getPend() == null))
                .limit(3)
                .map(PolicyResponse::from)
                .toList();
    }

    @GetMapping
    public List<PolicyResponse> getPolicies(
            @AuthenticationPrincipal OAuth2User oauth2User
    ) {
        String uid = getGoogleUid(oauth2User);

        return policyRepository.findAll().stream()
                .map(policy -> PolicyResponse.from(
                        policy,
                        bookmarkRepository.existsByUidAndPolicyId(uid, policy.getPolicyId())
                ))
                .toList();
    }

    @GetMapping("/{id}")
    public PolicyDetailResponse getPolicyDetail(@PathVariable String id) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "정책을 찾을 수 없습니다."));

        return PolicyDetailResponse.from(policy);
    }

    @GetMapping("/bookmarked")
    public List<PolicyResponse> getBookmarkedPolicies(
            @AuthenticationPrincipal OAuth2User oauth2User
    ) {
        String uid = getGoogleUid(oauth2User);

        return bookmarkRepository.findByUidOrderByCreatedAtDesc(uid).stream()
                .map(bookmark -> policyRepository.findById(bookmark.getPolicyId()).orElse(null))
                .filter(policy -> policy != null)
                .map(policy -> PolicyResponse.from(policy, true))
                .toList();
    }

    @GetMapping("/scrapped")
    public List<ScrappedPolicyResponse> getScrappedPolicies(
            @AuthenticationPrincipal OAuth2User oauth2User
    ) {
        String uid = getGoogleUid(oauth2User);

        return bookmarkRepository.findByUidOrderByCreatedAtDesc(uid).stream()
                .map(bookmark -> policyRepository.findById(bookmark.getPolicyId()).orElse(null))
                .filter(policy -> policy != null)
                .map(ScrappedPolicyResponse::from)
                .toList();
    }

    @PostMapping("/{id}/bookmark")
    public void bookmarkPolicy(
            @AuthenticationPrincipal OAuth2User oauth2User,
            @PathVariable String id
    ) {
        String uid = getGoogleUid(oauth2User);

        policyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "정책을 찾을 수 없습니다."));

        if (!bookmarkRepository.existsByUidAndPolicyId(uid, id)) {
            bookmarkRepository.save(new Bookmark(uid, id));
        }
    }

    @DeleteMapping("/{id}/bookmark")
    @Transactional
    public void deleteBookmark(
            @AuthenticationPrincipal OAuth2User oauth2User,
            @PathVariable String id
    ) {
        String uid = getGoogleUid(oauth2User);
        bookmarkRepository.deleteByUidAndPolicyId(uid, id);
    }

    private String getGoogleUid(OAuth2User oauth2User) {
        String sub = oauth2User.getAttribute("sub");

        if (sub == null || sub.isBlank()) {
            throw new IllegalArgumentException("Google OAuth sub 값이 없습니다.");
        }

        return sub;
    }
}