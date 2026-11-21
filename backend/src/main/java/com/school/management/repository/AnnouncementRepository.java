package com.school.management.repository;

import com.school.management.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByTargetRoleOrTargetRoleIsNull(String targetRole);
    List<Announcement> findByTargetClassId(Long classId);

    @Query("SELECT a FROM Announcement a WHERE a.targetRole = :targetRole OR a.targetRole = 'ALL' OR a.targetRole IS NULL ORDER BY a.datePosted DESC")
    List<Announcement> findByTargetRoleOrAll(@Param("targetRole") String targetRole);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Announcement a SET a.targetClass = null WHERE a.targetClass.id = :classId")
    void disassociateClass(@Param("classId") Long classId);
}
