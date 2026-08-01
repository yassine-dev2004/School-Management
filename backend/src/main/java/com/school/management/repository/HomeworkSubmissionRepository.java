package com.school.management.repository;

import com.school.management.entity.HomeworkSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomeworkSubmissionRepository extends JpaRepository<HomeworkSubmission, Long> {
    List<HomeworkSubmission> findByStudentId(Long studentId);
    List<HomeworkSubmission> findByHomeworkId(Long homeworkId);
}
