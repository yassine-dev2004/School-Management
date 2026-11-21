package com.school.management.repository;

import com.school.management.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {
    @Query("SELECT DISTINCT c FROM SchoolClass c LEFT JOIN c.teachers t WHERE c.teacher.id = :teacherId OR t.id = :teacherId")
    List<SchoolClass> findByTeacherId(@Param("teacherId") Long teacherId);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "DELETE FROM class_teachers WHERE teacher_id = :teacherId", nativeQuery = true)
    void deleteClassTeachersByTeacherId(@Param("teacherId") Long teacherId);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "DELETE FROM class_teachers WHERE class_id = :classId", nativeQuery = true)
    void deleteClassTeachersByClassId(@Param("classId") Long classId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE SchoolClass sc SET sc.teacher = null WHERE sc.teacher.id = :teacherId")
    void disassociateLeadTeacher(@Param("teacherId") Long teacherId);
}
