package com.school.management.controller;

import jakarta.validation.Valid;
import com.school.management.entity.Grade;
import com.school.management.repository.StudentRepository;
import com.school.management.repository.SubjectRepository;
import com.school.management.service.GradeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

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

    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<Grade> getAllGrades() {
        return gradeService.getAllGrades();
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER') or hasAuthority('PARENT') or hasAuthority('STUDENT')")
    public List<Grade> getGradesByStudent(@PathVariable Long studentId) {
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
                    if (gradeDetails.getStudent() != null && gradeDetails.getStudent().getId() != null) {
                        studentRepository.findById(gradeDetails.getStudent().getId()).ifPresent(grade::setStudent);
                    }
                    if (gradeDetails.getSubject() != null && gradeDetails.getSubject().getId() != null) {
                        subjectRepository.findById(gradeDetails.getSubject().getId()).ifPresent(grade::setSubject);
                    }
                    if (gradeDetails.getScore() != null) grade.setScore(gradeDetails.getScore());
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
