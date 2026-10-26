package com.school.management.service;

import com.school.management.entity.Announcement;
import com.school.management.entity.Homework;
import com.school.management.entity.SchoolClass;
import com.school.management.entity.Student;
import com.school.management.entity.Teacher;
import com.school.management.payload.request.ClassRequest;
import com.school.management.repository.AnnouncementRepository;
import com.school.management.repository.HomeworkRepository;
import com.school.management.repository.SchoolClassRepository;
import com.school.management.repository.StudentRepository;
import com.school.management.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class SchoolClassService {

    @Autowired
    private SchoolClassRepository schoolClassRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    public List<SchoolClass> getAllClasses() {
        return schoolClassRepository.findAll();
    }

    public Optional<SchoolClass> getClassById(Long id) {
        return schoolClassRepository.findById(id);
    }

    public List<Student> getStudentsByClassId(Long classId) {
        return schoolClassRepository.findById(classId)
                .map(SchoolClass::getStudents)
                .orElse(Collections.emptyList());
    }

    @Transactional
    public SchoolClass createClass(ClassRequest request) {
        SchoolClass sc = new SchoolClass();
        sc.setName(request.getName());
        sc.setSection(request.getSection());
        if (request.getTeacherId() != null) {
            Teacher teacher = teacherRepository.findById(request.getTeacherId()).orElse(null);
            sc.setTeacher(teacher);
        }
        return schoolClassRepository.save(sc);
    }

    @Transactional
    public SchoolClass updateClass(Long id, ClassRequest request) {
        SchoolClass sc = schoolClassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found with ID: " + id));
        sc.setName(request.getName());
        sc.setSection(request.getSection());
        if (request.getTeacherId() != null) {
            Teacher teacher = teacherRepository.findById(request.getTeacherId()).orElse(null);
            sc.setTeacher(teacher);
        } else {
            sc.setTeacher(null);
        }
        return schoolClassRepository.save(sc);
    }

    public SchoolClass saveClass(SchoolClass schoolClass) {
        if (schoolClass.getTeacher() != null && schoolClass.getTeacher().getId() != null) {
            teacherRepository.findById(schoolClass.getTeacher().getId()).ifPresent(schoolClass::setTeacher);
        }
        return schoolClassRepository.save(schoolClass);
    }

    @Transactional
    public void deleteClass(Long id) {
        // Safe delete: Disassociate students
        List<Student> students = studentRepository.findBySchoolClassId(id);
        for (Student s : students) {
            s.setSchoolClass(null);
            studentRepository.save(s);
        }

        // Disassociate homework
        try {
            List<Homework> homeworks = homeworkRepository.findBySchoolClassId(id);
            for (Homework h : homeworks) {
                h.setSchoolClass(null);
                homeworkRepository.save(h);
            }
        } catch (Exception ignored) {}

        // Disassociate announcements
        try {
            List<Announcement> announcements = announcementRepository.findByTargetClassId(id);
            for (Announcement a : announcements) {
                a.setTargetClass(null);
                announcementRepository.save(a);
            }
        } catch (Exception ignored) {}

        schoolClassRepository.deleteById(id);
    }
}
