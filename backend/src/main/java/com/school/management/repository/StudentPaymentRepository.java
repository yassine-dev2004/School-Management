package com.school.management.repository;

import com.school.management.entity.StudentPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentPaymentRepository extends JpaRepository<StudentPayment, Long> {
    @Query("SELECT p FROM StudentPayment p WHERE p.student.id = :studentId")
    List<StudentPayment> findByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT p FROM StudentPayment p WHERE p.student.id = :studentId AND p.academicYear = :academicYear")
    List<StudentPayment> findByStudentIdAndAcademicYear(@Param("studentId") Long studentId, @Param("academicYear") String academicYear);

    List<StudentPayment> findByAcademicYear(String academicYear);

    @Query("SELECT p FROM StudentPayment p WHERE p.student.schoolClass.id = :classId")
    List<StudentPayment> findByClassId(@Param("classId") Long classId);
}
