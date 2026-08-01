package com.school.management.repository;

import com.school.management.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByTargetRoleOrTargetRoleIsNull(String targetRole);
    List<Announcement> findByTargetClassId(Long classId);
}
