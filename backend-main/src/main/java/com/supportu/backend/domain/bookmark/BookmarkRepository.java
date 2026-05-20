package com.supportu.backend.domain.bookmark;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    boolean existsByUidAndPolicyId(String uid, String policyId);

    List<Bookmark> findByUidOrderByCreatedAtDesc(String uid);

    void deleteByUidAndPolicyId(String uid, String policyId);
}