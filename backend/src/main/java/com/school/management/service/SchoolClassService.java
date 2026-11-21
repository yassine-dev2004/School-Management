package com.school.management.service;

import com.school.management.entity.Announcement;
import com.school.management.entity.Homework;
import com.school.management.entity.SchoolClass;
import com.school.management.entity.Student;
import com.school.management.entity.Teacher;
import com.school.management.payload.request.ClassRequest;
import com.school.management.repository.*;
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

    @Autowired
    private DailyLessonLogRepository dailyLessonLogRepository;

    @Autowired
    private SchoolDocumentRepository schoolDocumentRepository;

    @Autowired
    private TeacherAttendanceRepository teacherAttendanceRepository;

    public List<SchoolClass> getAllClasses() {
        return schoolClassRepository.findAll();
    }

    public List<SchoolClass> getClassesByTeacherId(Long teacherId) {
        return schoolClassRepository.findByTeacherId(teacherId);
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
        if (request.getAnnualFee() != null) {
            sc.setAnnualFee(request.getAnnualFee());
        }

        java.util.Set<Teacher> assignedTeachers = new java.util.HashSet<>();
        if (request.getTeacherIds() != null && !request.getTeacherIds().isEmpty()) {
            assignedTeachers.addAll(teacherRepository.findAllById(request.getTeacherIds()));
        }
        if (request.getTeacherId() != null) {
            Teacher leadTeacher = teacherRepository.findById(request.getTeacherId()).orElse(null);
            sc.setTeacher(leadTeacher);
            if (leadTeacher != null) {
                assignedTeachers.add(leadTeacher);
            }
        } else if (!assignedTeachers.isEmpty()) {
            sc.setTeacher(assignedTeachers.iterator().next());
        }
        sc.setTeachers(assignedTeachers);
        return schoolClassRepository.save(sc);
    }

    @Transactional
    public SchoolClass updateClass(Long id, ClassRequest request) {
        SchoolClass sc = schoolClassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found with ID: " + id));
        sc.setName(request.getName());
        sc.setSection(request.getSection());
        if (request.getAnnualFee() != null) {
            sc.setAnnualFee(request.getAnnualFee());
        }

        java.util.Set<Teacher> assignedTeachers = new java.util.HashSet<>();
        if (request.getTeacherIds() != null && !request.getTeacherIds().isEmpty()) {
            assignedTeachers.addAll(teacherRepository.findAllById(request.getTeacherIds()));
        }
        if (request.getTeacherId() != null) {
            Teacher leadTeacher = teacherRepository.findById(request.getTeacherId()).orElse(null);
            sc.setTeacher(leadTeacher);
            if (leadTeacher != null) {
                assignedTeachers.add(leadTeacher);
            }
        } else if (!assignedTeachers.isEmpty()) {
            sc.setTeacher(assignedTeachers.iterator().next());
        } else {
            sc.setTeacher(null);
        }
        sc.setTeachers(assignedTeachers);
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
        // 1. Remove teacher assignments from join table
        try {
            schoolClassRepository.deleteClassTeachersByClassId(id);
        } catch (Exception ignored) {}

        // 2. Disassociate students (students remain enrolled in school, but without assigned class)
        try {
            studentRepository.disassociateClass(id);
        } catch (Exception ignored) {}

        // 3. Delete daily lesson logs for this class (not nullable class_id)
        try {
            dailyLessonLogRepository.deleteBySchoolClassId(id);
        } catch (Exception ignored) {}

        // 4. Disassociate school documents
        try {
            schoolDocumentRepository.disassociateClass(id);
        } catch (Exception ignored) {}

        // 5. Disassociate teacher attendance records
        try {
            teacherAttendanceRepository.disassociateClass(id);
        } catch (Exception ignored) {}

        // 6. Disassociate homework
        try {
            homeworkRepository.disassociateClass(id);
        } catch (Exception ignored) {}

        // 7. Disassociate announcements
        try {
            announcementRepository.disassociateClass(id);
        } catch (Exception ignored) {}

        // 8. Delete class record
        schoolClassRepository.deleteById(id);
    }
}
