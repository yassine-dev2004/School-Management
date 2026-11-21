package com.school.management.repository;

import com.school.management.entity.DailyLessonLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface DailyLessonLogRepository extends JpaRepository<DailyLessonLog, Long> {
    List<DailyLessonLog> findBySchoolClassIdOrderByDateDesc(Long classId);

    List<DailyLessonLog> findBySchoolClassIdAndDateOrderByPeriodAsc(Long classId, Date date);

    List<DailyLessonLog> findByDateOrderByDateDesc(Date date);

    List<DailyLessonLog> findTop20BySchoolClassIdOrderByDateDesc(Long classId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE DailyLessonLog l SET l.teacher = null WHERE l.teacher.id = :teacherId")
    void disassociateTeacher(@org.springframework.data.repository.query.Param("teacherId") Long teacherId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM DailyLessonLog l WHERE l.schoolClass.id = :classId")
    void deleteBySchoolClassId(@org.springframework.data.repository.query.Param("classId") Long classId);
}
