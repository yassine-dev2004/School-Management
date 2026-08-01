package com.school.management.controller;

import jakarta.validation.Valid;
import com.school.management.entity.Homework;
import com.school.management.service.HomeworkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/homework")
public class HomeworkController {

    @Autowired
    private HomeworkService homeworkService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<Homework> getAllHomework() {
        return homeworkService.getAllHomework();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER') or hasAuthority('STUDENT')")
    public ResponseEntity<Homework> getHomeworkById(@PathVariable Long id) {
        return homeworkService.getHomeworkById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER') or hasAuthority('STUDENT') or hasAuthority('PARENT')")
    public List<Homework> getHomeworkByClass(@PathVariable Long classId) {
        return homeworkService.getHomeworkByClassId(classId);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public Homework createHomework(@Valid @RequestBody Homework homework) {
        return homeworkService.saveHomework(homework);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<Homework> updateHomework(@PathVariable Long id, @Valid @RequestBody Homework homeworkDetails) {
        return homeworkService.getHomeworkById(id)
                .map(homework -> {
                    homework.setTitle(homeworkDetails.getTitle());
                    homework.setDescription(homeworkDetails.getDescription());
                    homework.setDueDate(homeworkDetails.getDueDate());
                    return ResponseEntity.ok(homeworkService.saveHomework(homework));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<?> deleteHomework(@PathVariable Long id) {
        return homeworkService.getHomeworkById(id)
                .map(homework -> {
                    homeworkService.deleteHomework(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
