package com.school.management.repository;

import com.school.management.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM teacher_subjects WHERE teacher_id = :teacherId", nativeQuery = true)
    void deleteTeacherSubjectsByTeacherId(@org.springframework.data.repository.query.Param("teacherId") Long teacherId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Teacher t WHERE t.id = :id")
    void deleteTeacherById(@org.springframework.data.repository.query.Param("id") Long id);
}
