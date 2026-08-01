package com.school.management.controller;

import jakarta.validation.Valid;
import com.school.management.entity.Teacher;
import com.school.management.service.TeacherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    @Autowired
    private TeacherService teacherService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public List<Teacher> getAllTeachers() {
        return teacherService.getAllTeachers();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<Teacher> getTeacherById(@PathVariable Long id) {
        return teacherService.getTeacherById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public Teacher createTeacher(@Valid @RequestBody com.school.management.payload.request.TeacherRequest request) {
        return teacherService.createTeacher(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<Teacher> updateTeacher(@PathVariable Long id, @Valid @RequestBody com.school.management.payload.request.TeacherRequest request) {
        try {
            return ResponseEntity.ok(teacherService.updateTeacher(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> deleteTeacher(@PathVariable Long id) {
        return teacherService.getTeacherById(id)
                .map(teacher -> {
                    teacherService.deleteTeacher(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
