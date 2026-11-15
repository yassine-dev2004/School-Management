package com.school.management.controller;

import com.school.management.entity.DailyLessonLog;
import com.school.management.entity.Teacher;
import com.school.management.repository.TeacherRepository;
import com.school.management.security.UserDetailsImpl;
import com.school.management.service.DailyLessonLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/logbook")
public class DailyLessonLogController {

    @Autowired
    private DailyLessonLogService dailyLessonLogService;

    @Autowired
    private TeacherRepository teacherRepository;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        return null;
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
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER') or hasAuthority('PARENT') or hasAuthority('STUDENT')")
    public List<DailyLessonLog> getAll(
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date date) {
        return dailyLessonLogService.getAll(classId, date);
    }

    @GetMapping("/class/{classId}/recent")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER') or hasAuthority('PARENT') or hasAuthority('STUDENT')")
    public List<DailyLessonLog> getRecentForClass(@PathVariable Long classId) {
        return dailyLessonLogService.getRecentForClass(classId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER') or hasAuthority('PARENT')")
    public ResponseEntity<DailyLessonLog> getById(@PathVariable Long id) {
        return dailyLessonLogService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<DailyLessonLog> createOrUpdate(@RequestBody DailyLessonLog log) {
        if (log.getTeacher() == null || log.getTeacher().getId() == null) {
            Long userId = getCurrentUserId();
            if (userId != null) {
                teacherRepository.findById(userId).ifPresent(log::setTeacher);
            }
        }
        return ResponseEntity.ok(dailyLessonLogService.save(log));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        dailyLessonLogService.delete(id);
        return ResponseEntity.ok().build();
    }
}
