package com.supportu.backend.api.checklist;

import com.supportu.backend.domain.policy.Policy;
import com.supportu.backend.domain.policy.PolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/checklist")
@RequiredArgsConstructor
public class ChecklistController {

    private final PolicyRepository policyRepository;

    // 임시 완료 상태 저장.
    // 서버 재시작 시 초기화됨. 나중에 user별 checklist 테이블 생기면 DB 저장으로 교체.
    private final Map<Long, Boolean> doneStore = new ConcurrentHashMap<>();

    @GetMapping
    public List<ChecklistResponse> getChecklist() {
        List<ChecklistResponse> responses = new ArrayList<>();

        for (Policy policy : policyRepository.findAll()) {
            List<String> documents = parseRequiredDocuments(policy.getRequiredDocuments());

            for (String document : documents) {
                long id = createStableId(policy.getPolicyId(), document);
                boolean done = doneStore.getOrDefault(id, false);
                responses.add(ChecklistResponse.from(policy, document, done));
            }
        }

        return responses.stream()
                .limit(10)
                .toList();
    }

    @PutMapping("/{id}")
    public void updateChecklistItem(
            @PathVariable Long id,
            @RequestBody ChecklistUpdateRequest request
    ) {
        doneStore.put(id, request.done());
    }

    private List<String> parseRequiredDocuments(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }

        String normalized = raw
                .replace("[", "")
                .replace("]", "")
                .replace("\"", "")
                .replace("'", "")
                .replace("ㆍ", ",")
                .replace("·", ",")
                .replace("•", ",")
                .replace("\r", "\n");

        return Arrays.stream(normalized.split("[,\\n;/]+"))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .filter(value -> !value.equals("-"))
                .distinct()
                .toList();
    }

    private long createStableId(String policyId, String documentName) {
        String raw = policyId + ":" + documentName;
        return Math.abs((long) raw.hashCode());
    }
}