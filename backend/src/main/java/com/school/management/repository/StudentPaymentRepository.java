package com.school.management.repository;

import com.school.management.entity.StudentPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentPaymentRepository extends JpaRepository<StudentPayment, Long> {
    List<StudentPayment> findByStudentId(Long studentId);

    List<StudentPayment> findByStudentIdAndAcademicYear(Long studentId, String academicYear);

    List<StudentPayment> findByAcademicYear(String academicYear);

    @Query("SELECT p FROM StudentPayment p WHERE p.student.schoolClass.id = :classId")
    List<StudentPayment> findByClassId(@Param("classId") Long classId);
}
