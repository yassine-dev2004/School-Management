package com.school.management.controller;

import jakarta.validation.Valid;
import com.school.management.entity.HomeworkSubmission;
import com.school.management.service.HomeworkSubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/submissions")
public class HomeworkSubmissionController {

    @Autowired
    private HomeworkSubmissionService submissionService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<HomeworkSubmission> getAllSubmissions() {
        return submissionService.getAllSubmissions();
    }

    @GetMapping("/homework/{homeworkId}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<HomeworkSubmission> getSubmissionsByHomework(@PathVariable Long homeworkId) {
        return submissionService.getSubmissionsByHomeworkId(homeworkId);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('STUDENT')")
    public HomeworkSubmission createSubmission(@Valid @RequestBody HomeworkSubmission submission) {
        return submissionService.saveSubmission(submission);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<HomeworkSubmission> updateSubmission(@PathVariable Long id, @Valid @RequestBody HomeworkSubmission submissionDetails) {
        return submissionService.getSubmissionById(id)
                .map(submission -> {
                    submission.setStatus(submissionDetails.getStatus());
                    return ResponseEntity.ok(submissionService.saveSubmission(submission));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> deleteSubmission(@PathVariable Long id) {
        return submissionService.getSubmissionById(id)
                .map(submission -> {
                    submissionService.deleteSubmission(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
