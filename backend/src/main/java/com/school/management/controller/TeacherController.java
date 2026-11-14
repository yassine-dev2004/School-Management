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

    @Autowired
    private com.school.management.repository.SchoolClassRepository schoolClassRepository;

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('TEACHER') or hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> getMyTeacherProfile() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.school.management.security.UserDetailsImpl) {
            com.school.management.security.UserDetailsImpl userDetails = (com.school.management.security.UserDetailsImpl) auth.getPrincipal();
            return teacherService.getTeacherById(userDetails.getId())
                    .map(teacher -> {
                        java.util.Map<String, Object> resp = new java.util.HashMap<>();
                        resp.put("id", teacher.getId());
                        resp.put("firstName", teacher.getUser() != null ? teacher.getUser().getFirstName() : "");
                        resp.put("lastName", teacher.getUser() != null ? teacher.getUser().getLastName() : "");
                        resp.put("username", teacher.getUser() != null ? teacher.getUser().getUsername() : "");
                        resp.put("email", teacher.getUser() != null ? teacher.getUser().getEmail() : "");
                        resp.put("phone", teacher.getUser() != null ? teacher.getUser().getPhone() : "");
                        resp.put("qualification", teacher.getQualification());
                        resp.put("joiningDate", teacher.getJoiningDate());
                        resp.put("subjects", teacher.getSubjects());
                        resp.put("classes", schoolClassRepository.findByTeacherId(teacher.getId()));
                        return ResponseEntity.ok(resp);
                    })
                    .orElse(ResponseEntity.notFound().build());
        }
        return ResponseEntity.status(401).build();
    }

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
