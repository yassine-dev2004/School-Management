package com.school.management.service;

import com.school.management.entity.Homework;
import com.school.management.entity.SchoolClass;
import com.school.management.entity.Subject;
import com.school.management.entity.Teacher;
import com.school.management.payload.request.HomeworkRequest;
import com.school.management.repository.HomeworkRepository;
import com.school.management.repository.SchoolClassRepository;
import com.school.management.repository.SubjectRepository;
import com.school.management.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class HomeworkService {

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private SchoolClassRepository schoolClassRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    public List<Homework> getAllHomework() {
        return homeworkRepository.findAll();
    }

    public Optional<Homework> getHomeworkById(Long id) {
        return homeworkRepository.findById(id);
    }

    public List<Homework> getHomeworkByClassId(Long classId) {
        return homeworkRepository.findBySchoolClassId(classId);
    }

    @Transactional
    public Homework createHomework(HomeworkRequest request) {
        Homework homework = new Homework();
        homework.setTitle(request.getTitle());
        homework.setDescription(request.getDescription());
        homework.setDueDate(request.getDueDate());

        if (request.getClassId() != null) {
            SchoolClass sc = schoolClassRepository.findById(request.getClassId()).orElse(null);
            homework.setSchoolClass(sc);
        }
        if (request.getSubjectId() != null) {
            Subject sb = subjectRepository.findById(request.getSubjectId()).orElse(null);
            homework.setSubject(sb);
        }
        if (request.getTeacherId() != null) {
            Teacher t = teacherRepository.findById(request.getTeacherId()).orElse(null);
            homework.setTeacher(t);
        }

        return homeworkRepository.save(homework);
    }

    @Transactional
    public Homework updateHomework(Long id, HomeworkRequest request) {
        Homework homework = homeworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Homework not found with ID: " + id));

        homework.setTitle(request.getTitle());
        homework.setDescription(request.getDescription());
        homework.setDueDate(request.getDueDate());

        if (request.getClassId() != null) {
            SchoolClass sc = schoolClassRepository.findById(request.getClassId()).orElse(null);
            homework.setSchoolClass(sc);
        } else {
            homework.setSchoolClass(null);
        }

        if (request.getSubjectId() != null) {
            Subject sb = subjectRepository.findById(request.getSubjectId()).orElse(null);
            homework.setSubject(sb);
        } else {
            homework.setSubject(null);
        }

        if (request.getTeacherId() != null) {
            Teacher t = teacherRepository.findById(request.getTeacherId()).orElse(null);
            homework.setTeacher(t);
        } else {
            homework.setTeacher(null);
        }

        return homeworkRepository.save(homework);
    }

    public Homework saveHomework(Homework homework) {
        if (homework.getSchoolClass() != null && homework.getSchoolClass().getId() != null) {
            schoolClassRepository.findById(homework.getSchoolClass().getId()).ifPresent(homework::setSchoolClass);
        }
        if (homework.getSubject() != null && homework.getSubject().getId() != null) {
            subjectRepository.findById(homework.getSubject().getId()).ifPresent(homework::setSubject);
        }
        if (homework.getTeacher() != null && homework.getTeacher().getId() != null) {
            teacherRepository.findById(homework.getTeacher().getId()).ifPresent(homework::setTeacher);
        }
        return homeworkRepository.save(homework);
    }

    @Transactional
    public void deleteHomework(Long id) {
        homeworkRepository.deleteById(id);
    }
}
