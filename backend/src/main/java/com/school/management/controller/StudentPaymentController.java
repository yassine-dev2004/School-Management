package com.school.management.controller;

import com.school.management.entity.Parent;
import com.school.management.entity.Student;
import com.school.management.entity.StudentPayment;
import com.school.management.repository.ParentRepository;
import com.school.management.security.UserDetailsImpl;
import com.school.management.service.StudentPaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/payments")
public class StudentPaymentController {

    @Autowired
    private StudentPaymentService studentPaymentService;

    @Autowired
    private ParentRepository parentRepository;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        throw new RuntimeException("المستخدم غير مسجل الدخول");
    }

    private boolean isUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ADMINISTRATOR"));
        }
        return false;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<StudentPayment> getAll(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String status) {
        return studentPaymentService.getAll(studentId, classId, academicYear, status);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<StudentPayment> getById(@PathVariable Long id) {
        return studentPaymentService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}/summary")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER') or hasAuthority('PARENT')")
    public ResponseEntity<Map<String, Object>> getStudentSummary(
            @PathVariable Long studentId,
            @RequestParam(required = false, defaultValue = "2026-2027") String academicYear) {
        return ResponseEntity.ok(studentPaymentService.getStudentTuitionSummary(studentId, academicYear));
    }

    @GetMapping("/my-children")
    @PreAuthorize("hasAuthority('PARENT')")
    public ResponseEntity<?> getMyChildrenTuitionSummaries(
            @RequestParam(required = false, defaultValue = "2026-2027") String academicYear) {
        Long parentUserId = getCurrentUserId();
        Optional<Parent> parentOpt = parentRepository.findById(parentUserId);
        if (parentOpt.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        Parent parent = parentOpt.get();
        List<Map<String, Object>> summaries = new ArrayList<>();
        if (parent.getChildren() != null) {
            for (Student child : parent.getChildren()) {
                summaries.add(studentPaymentService.getStudentTuitionSummary(child.getId(), academicYear));
            }
        }
        return ResponseEntity.ok(summaries);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<StudentPayment> createOrUpdatePayment(@RequestBody StudentPayment payment) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (payment.getRecordedBy() == null || payment.getRecordedBy().trim().isEmpty()) {
            payment.setRecordedBy(auth != null ? auth.getName() : "ADMIN");
        }
        return ResponseEntity.ok(studentPaymentService.save(payment));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> deletePayment(@PathVariable Long id) {
        studentPaymentService.delete(id);
        return ResponseEntity.ok().build();
    }
}
