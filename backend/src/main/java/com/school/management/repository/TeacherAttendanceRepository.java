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
}
