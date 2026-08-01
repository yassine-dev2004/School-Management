package com.school.management.controller;

import jakarta.validation.Valid;
import com.school.management.entity.SchoolClass;
import com.school.management.entity.Student;
import com.school.management.service.SchoolClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/classes")
public class SchoolClassController {

    @Autowired
    private SchoolClassService schoolClassService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<SchoolClass> getAllClasses() {
        return schoolClassService.getAllClasses();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<SchoolClass> getClassById(@PathVariable Long id) {
        return schoolClassService.getClassById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/students")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<Student> getStudentsInClass(@PathVariable Long id) {
        return schoolClassService.getStudentsByClassId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public SchoolClass createClass(@Valid @RequestBody SchoolClass schoolClass) {
        return schoolClassService.saveClass(schoolClass);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<SchoolClass> updateClass(@PathVariable Long id, @Valid @RequestBody SchoolClass classDetails) {
        return schoolClassService.getClassById(id)
                .map(schoolClass -> {
                    schoolClass.setName(classDetails.getName());
                    schoolClass.setSection(classDetails.getSection());
                    schoolClass.setTeacher(classDetails.getTeacher());
                    return ResponseEntity.ok(schoolClassService.saveClass(schoolClass));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> deleteClass(@PathVariable Long id) {
        return schoolClassService.getClassById(id)
                .map(schoolClass -> {
                    schoolClassService.deleteClass(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
