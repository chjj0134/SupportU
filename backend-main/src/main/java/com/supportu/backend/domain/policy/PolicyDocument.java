package com.supportu.backend.domain.policy;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Getter
@Table(name = "policy_documents")
public class PolicyDocument {

    @Id
    @Column(name = "doc_id")
    private Long docId;

    @Column(name = "policy_id")
    private String policyId;

    @Column(name = "doc_name")
    private String docName;

    @Column(name = "is_required")
    private Boolean required;

    @Column(name = "doc_guide")
    private String docGuide;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "doc_url")
    private String docUrl;
}