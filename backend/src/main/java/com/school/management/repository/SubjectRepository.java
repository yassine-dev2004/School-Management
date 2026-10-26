package com.school.management.repository;

import com.school.management.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM teacher_subjects WHERE subject_id = :subjectId", nativeQuery = true)
    void deleteTeacherSubjectsBySubjectId(@org.springframework.data.repository.query.Param("subjectId") Long subjectId);
}
