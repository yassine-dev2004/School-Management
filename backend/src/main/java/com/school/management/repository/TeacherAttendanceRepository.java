package com.school.management.repository;

import com.school.management.entity.TeacherAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherAttendanceRepository extends JpaRepository<TeacherAttendance, Long> {
    List<TeacherAttendance> findByTeacherIdOrderByDateDesc(Long teacherId);
    List<TeacherAttendance> findByDate(Date date);
    Optional<TeacherAttendance> findByTeacherIdAndDate(Long teacherId, Date date);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM TeacherAttendance ta WHERE ta.teacher.id = :teacherId")
    void deleteByTeacherId(@org.springframework.data.repository.query.Param("teacherId") Long teacherId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE TeacherAttendance ta SET ta.schoolClass = null WHERE ta.schoolClass.id = :classId")
    void disassociateClass(@org.springframework.data.repository.query.Param("classId") Long classId);
}
