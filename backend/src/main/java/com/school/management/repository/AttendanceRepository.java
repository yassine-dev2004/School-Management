package com.school.management.repository;

import com.school.management.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);
    List<Attendance> findByDate(Date date);
    List<Attendance> findByStudentIdAndDateBetween(Long studentId, Date startDate, Date endDate);
}
