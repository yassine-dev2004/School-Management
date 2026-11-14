package com.school.management.controller;

import jakarta.validation.Valid;
import com.school.management.entity.Grade;
import com.school.management.entity.SchoolClass;
import com.school.management.entity.Student;
import com.school.management.entity.Subject;
import com.school.management.entity.Teacher;
import com.school.management.repository.SchoolClassRepository;
import com.school.management.repository.StudentRepository;
import com.school.management.repository.SubjectRepository;
import com.school.management.repository.TeacherRepository;
import com.school.management.security.UserDetailsImpl;
import com.school.management.service.GradeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/grades")
public class GradeController {

    @Autowired
    private GradeService gradeService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private SchoolClassRepository schoolClassRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    private boolean isTeacherOnly() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMINISTRATOR"));
            boolean isTeacher = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("TEACHER"));
            return isTeacher && !isAdmin;
        }
        return false;
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        return null;
    }

    private Set<Long> getTeacherAllowedStudentIds(Long teacherId) {
        List<SchoolClass> classes = schoolClassRepository.findByTeacherId(teacherId);
        Set<Long> studentIds = new HashSet<>();
        for (SchoolClass sc : classes) {
            if (sc.getStudents() != null) {
                for (Student s : sc.getStudents()) {
                    studentIds.add(s.getId());
                }
            }
        }
        return studentIds;
    }

    private Set<Long> getTeacherAllowedSubjectIds(Long teacherId) {
        return teacherRepository.findById(teacherId)
                .map(t -> t.getSubjects().stream().map(Subject::getId).collect(Collectors.toSet()))
                .orElse(Collections.emptySet());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<Grade> getAllGrades() {
        if (isTeacherOnly()) {
            Long teacherId = getCurrentUserId();
            Set<Long> allowedStudents = getTeacherAllowedStudentIds(teacherId);
            Set<Long> allowedSubjects = getTeacherAllowedSubjectIds(teacherId);

            return gradeService.getAllGrades().stream()
                    .filter(g -> g.getStudent() != null && allowedStudents.contains(g.getStudent().getId()))
                    .filter(g -> g.getSubject() != null && (allowedSubjects.isEmpty() || allowedSubjects.contains(g.getSubject().getId())))
                    .collect(Collectors.toList());
        }
        return gradeService.getAllGrades();
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER') or hasAuthority('PARENT') or hasAuthority('STUDENT')")
    public List<Grade> getGradesByStudent(@PathVariable Long studentId) {
        if (isTeacherOnly()) {
            Long teacherId = getCurrentUserId();
            Set<Long> allowedStudents = getTeacherAllowedStudentIds(teacherId);
            if (!allowedStudents.contains(studentId)) {
                throw new AccessDeniedException("هذا الطالب لا ينتمي لأحد فصولك المسندة");
            }
            Set<Long> allowedSubjects = getTeacherAllowedSubjectIds(teacherId);
            return gradeService.getGradesByStudentId(studentId).stream()
                    .filter(g -> g.getSubject() != null && (allowedSubjects.isEmpty() || allowedSubjects.contains(g.getSubject().getId())))
                    .collect(Collectors.toList());
        }
        return gradeService.getGradesByStudentId(studentId);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public Grade createGrade(@Valid @RequestBody Grade grade) {
        if (grade.getStudent() != null && grade.getStudent().getId() != null) {
            studentRepository.findById(grade.getStudent().getId()).ifPresent(grade::setStudent);
        }
        if (grade.getSubject() != null && grade.getSubject().getId() != null) {
            subjectRepository.findById(grade.getSubject().getId()).ifPresent(grade::setSubject);
        }

        if (isTeacherOnly()) {
            Long teacherId = getCurrentUserId();
            Set<Long> allowedStudents = getTeacherAllowedStudentIds(teacherId);
            Set<Long> allowedSubjects = getTeacherAllowedSubjectIds(teacherId);

            Long studentId = grade.getStudent() != null ? grade.getStudent().getId() : null;
            Long subjectId = grade.getSubject() != null ? grade.getSubject().getId() : null;

            if (studentId == null || !allowedStudents.contains(studentId)) {
                throw new AccessDeniedException("لا يمكنك رصد درجة لطالب خارج فصولك المسندة");
            }
            if (subjectId != null && !allowedSubjects.isEmpty() && !allowedSubjects.contains(subjectId)) {
                throw new AccessDeniedException("لا يمكنك رصد درجة لمادة غير مسندة إلى جدولك التعليمي");
            }
        }

        if (grade.getRecordedDate() == null) {
            grade.setRecordedDate(new Date());
        }
        return gradeService.saveGrade(grade);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<Grade> updateGrade(@PathVariable Long id, @Valid @RequestBody Grade gradeDetails) {
        return gradeService.getGradeById(id)
                .map(grade -> {
                    if (isTeacherOnly()) {
                        Long teacherId = getCurrentUserId();
                        Set<Long> allowedStudents = getTeacherAllowedStudentIds(teacherId);
                        Set<Long> allowedSubjects = getTeacherAllowedSubjectIds(teacherId);

                        if (grade.getStudent() == null || !allowedStudents.contains(grade.getStudent().getId())) {
                            throw new AccessDeniedException("ليس لديك صلاحية لتعديل درجة هذا الطالب");
                        }
                        if (grade.getSubject() != null && !allowedSubjects.isEmpty() && !allowedSubjects.contains(grade.getSubject().getId())) {
                            throw new AccessDeniedException("ليس لديك صلاحية لتعديل درجة مادة غير مسندة إليك");
                        }
                    }

                    if (gradeDetails.getStudent() != null && gradeDetails.getStudent().getId() != null) {
                        studentRepository.findById(gradeDetails.getStudent().getId()).ifPresent(grade::setStudent);
                    }
                    if (gradeDetails.getSubject() != null && gradeDetails.getSubject().getId() != null) {
                        subjectRepository.findById(gradeDetails.getSubject().getId()).ifPresent(grade::setSubject);
                    }
                    if (gradeDetails.getScore() != null) grade.setScore(gradeDetails.getScore());
                    if (gradeDetails.getMaxScore() != null) grade.setMaxScore(gradeDetails.getMaxScore());
                    if (gradeDetails.getTerm() != null) grade.setTerm(gradeDetails.getTerm());
                    if (gradeDetails.getComments() != null) grade.setComments(gradeDetails.getComments());
                    if (gradeDetails.getExamType() != null) grade.setExamType(gradeDetails.getExamType());
                    if (gradeDetails.getRecordedDate() != null) grade.setRecordedDate(gradeDetails.getRecordedDate());
                    return ResponseEntity.ok(gradeService.saveGrade(grade));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> deleteGrade(@PathVariable Long id) {
        return gradeService.getGradeById(id)
                .map(grade -> {
                    gradeService.deleteGrade(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
