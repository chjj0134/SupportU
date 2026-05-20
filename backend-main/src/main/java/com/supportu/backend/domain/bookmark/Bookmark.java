package com.supportu.backend.domain.bookmark;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "bookmarks")
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bid")
    private Long bid;

    @Column(name = "uid", nullable = false)
    private String uid;

    @Column(name = "policy_id", nullable = false)
    private String policyId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Bookmark(String uid, String policyId) {
        this.uid = uid;
        this.policyId = policyId;
        this.createdAt = LocalDateTime.now();
    }
}