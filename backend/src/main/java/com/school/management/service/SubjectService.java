package com.school.management.service;

import com.school.management.entity.Grade;
import com.school.management.entity.Homework;
import com.school.management.entity.Subject;
import com.school.management.repository.GradeRepository;
import com.school.management.repository.HomeworkRepository;
import com.school.management.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class SubjectService {

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;

    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    public Optional<Subject> getSubjectById(Long id) {
        return subjectRepository.findById(id);
    }

    public Subject saveSubject(Subject subject) {
        return subjectRepository.save(subject);
    }

    @Transactional
    public void deleteSubject(Long id) {
        // Clean up grades for this subject
        List<Grade> grades = gradeRepository.findBySubjectId(id);
        gradeRepository.deleteAll(grades);

        // Delete subject
        subjectRepository.deleteById(id);
    }
}
