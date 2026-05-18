package com.supportu.backend.domain.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "user_profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserProfile {

    @Id
    @Column(name = "uid", nullable = false)
    private String uid;

    @Column(name = "age")
    private Integer age;

    @Column(name = "gender")
    private String gender;

    @Column(name = "city")
    private String city;

    @Column(name = "scity")
    private String scity;

    @Column(name = "education")
    private String education;

    @Column(name = "employment")
    private String employment;

    @Column(name = "disability")
    private Boolean disability;

    @Column(name = "income_integer")
    private Long incomeInteger;

    @Column(name = "asset")
    private String asset;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "preferred_categories", columnDefinition = "text[]")
    private String[] preferredCategories;

    public UserProfile(String uid) {
        this.uid = uid;
        this.createdAt = LocalDateTime.now();
    }

    public void updateProfile(
            Integer age,
            String gender,
            String city,
            String scity,
            String education,
            String employment,
            Boolean disability,
            Long incomeInteger,
            String asset,
            String[] preferredCategories
    ) {
        this.age = age;
        this.gender = gender;
        this.city = city;
        this.scity = scity;
        this.education = education;
        this.employment = employment;
        this.disability = disability;
        this.incomeInteger = incomeInteger;
        this.asset = asset;
        this.preferredCategories = preferredCategories;
    }
}