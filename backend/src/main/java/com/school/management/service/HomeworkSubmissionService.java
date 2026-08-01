package com.school.management.service;

import com.school.management.entity.HomeworkSubmission;
import com.school.management.repository.HomeworkSubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HomeworkSubmissionService {

    @Autowired
    private HomeworkSubmissionRepository homeworkSubmissionRepository;

    public List<HomeworkSubmission> getAllSubmissions() {
        return homeworkSubmissionRepository.findAll();
    }

    public Optional<HomeworkSubmission> getSubmissionById(Long id) {
        return homeworkSubmissionRepository.findById(id);
    }

    public List<HomeworkSubmission> getSubmissionsByHomeworkId(Long homeworkId) {
        return homeworkSubmissionRepository.findByHomeworkId(homeworkId);
    }

    public HomeworkSubmission saveSubmission(HomeworkSubmission submission) {
        return homeworkSubmissionRepository.save(submission);
    }

    public void deleteSubmission(Long id) {
        homeworkSubmissionRepository.deleteById(id);
    }
}
