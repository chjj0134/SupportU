package com.supportu.backend.domain.calendar;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserCalendarEventRepository extends JpaRepository<UserCalendarEvent, Long> {

    List<UserCalendarEvent> findByUidOrderByEventStartAtAsc(String uid);

    Optional<UserCalendarEvent> findByUidAndPolicyId(String uid, String policyId);

    Optional<UserCalendarEvent> findByCidAndUid(Long cid, String uid);

    boolean existsByUidAndPolicyId(String uid, String policyId);
}