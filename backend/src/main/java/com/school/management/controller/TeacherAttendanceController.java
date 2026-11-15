package com.school.management.controller;

import com.school.management.entity.TeacherAttendance;
import com.school.management.security.UserDetailsImpl;
import com.school.management.service.TeacherAttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/teacher-attendance")
public class TeacherAttendanceController {

    @Autowired
    private TeacherAttendanceService teacherAttendanceService;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        throw new RuntimeException("المستخدم غير مسجل الدخول / User not authenticated");
    }

    private boolean isUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ADMINISTRATOR"));
        }
        return false;
    }

    /**
     * Teacher self check-in endpoint:
     * Teacher marks themselves present (or late) for today or specified date.
     */
    @PostMapping("/check-in")
    @PreAuthorize("hasAuthority('TEACHER') or hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<TeacherAttendance> selfCheckIn(@RequestBody(required = false) Map<String, Object> body) {
        Long teacherId = getCurrentUserId();
        // If admin specifies a different teacherId in body, allow it
        if (isUserAdmin() && body != null && body.get("teacherId") != null) {
            teacherId = Long.valueOf(body.get("teacherId").toString());
        }

        String status = body != null && body.get("status") != null ? body.get("status").toString() : "حاضر";
        String remarks = body != null && body.get("remarks") != null ? body.get("remarks").toString() : "";
        Double hoursCount = body != null && body.get("hoursCount") != null ? Double.valueOf(body.get("hoursCount").toString()) : null;
        String startTime = body != null && body.get("startTime") != null ? body.get("startTime").toString() : null;
        String endTime = body != null && body.get("endTime") != null ? body.get("endTime").toString() : null;
        Double hourlyRate = body != null && body.get("hourlyRate") != null ? Double.valueOf(body.get("hourlyRate").toString()) : null;
        Long subjectId = body != null && body.get("subjectId") != null ? Long.valueOf(body.get("subjectId").toString()) : null;
        Long classId = body != null && body.get("classId") != null ? Long.valueOf(body.get("classId").toString()) : null;

        Date date = null;
        if (body != null && body.get("date") != null) {
            try {
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                sdf.setTimeZone(TimeZone.getTimeZone("Africa/Tunis"));
                date = sdf.parse(body.get("date").toString());
            } catch (Exception ignored) {}
        }

        TeacherAttendance att = teacherAttendanceService.recordSelfCheckIn(
                teacherId, date, status, remarks, hoursCount, startTime, endTime, subjectId, classId, hourlyRate);
        return ResponseEntity.ok(att);
    }

    /**
     * Get attendance history for the logged-in teacher
     */
    @GetMapping("/me")
    @PreAuthorize("hasAuthority('TEACHER') or hasAuthority('ADMINISTRATOR')")
    public List<TeacherAttendance> getMyAttendance() {
        Long teacherId = getCurrentUserId();
        return teacherAttendanceService.getMyAttendance(teacherId);
    }

    /**
     * Check if the logged-in teacher has marked attendance today
     */
    @GetMapping("/me/today")
    @PreAuthorize("hasAuthority('TEACHER') or hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> getTodayCheckIn() {
        Long teacherId = getCurrentUserId();
        Optional<TeacherAttendance> today = teacherAttendanceService.getTeacherTodayAttendance(teacherId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("checkedIn", today.isPresent());
        resp.put("attendance", today.orElse(null));
        return ResponseEntity.ok(resp);
    }

    /**
     * List all teacher attendances (Admin gets all, Teacher gets own)
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<TeacherAttendance> getAll(@RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date date) {
        if (!isUserAdmin()) {
            return teacherAttendanceService.getMyAttendance(getCurrentUserId());
        }
        if (date != null) {
            return teacherAttendanceService.getByDate(date);
        }
        return teacherAttendanceService.getAll();
    }

    /**
     * Admin manual save / update of teacher attendance
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<TeacherAttendance> saveAttendance(@RequestBody TeacherAttendance attendance) {
        return ResponseEntity.ok(teacherAttendanceService.save(attendance));
    }

    /**
     * Admin delete teacher attendance record
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> deleteAttendance(@PathVariable Long id) {
        teacherAttendanceService.delete(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/hours-summary")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<?> getHoursSummary(@RequestParam(required = false) Long teacherId) {
        Long targetTeacherId = isUserAdmin() && teacherId != null ? teacherId : getCurrentUserId();
        List<TeacherAttendance> records = teacherAttendanceService.getMyAttendance(targetTeacherId);
        double totalHours = records.stream()
                .filter(r -> "حاضر".equalsIgnoreCase(r.getStatus()) || "PRESENT".equalsIgnoreCase(r.getStatus()))
                .mapToDouble(r -> r.getHoursCount() != null ? r.getHoursCount() : 1.0)
                .sum();
        double totalEarnings = records.stream()
                .filter(r -> "حاضر".equalsIgnoreCase(r.getStatus()) || "PRESENT".equalsIgnoreCase(r.getStatus()))
                .mapToDouble(r -> (r.getHoursCount() != null ? r.getHoursCount() : 1.0) * (r.getHourlyRate() != null ? r.getHourlyRate() : 25.0))
                .sum();

        Map<String, Object> summary = new HashMap<>();
        summary.put("teacherId", targetTeacherId);
        summary.put("totalSessions", records.size());
        summary.put("totalHours", Math.round(totalHours * 100.0) / 100.0);
        summary.put("totalEarnings", Math.round(totalEarnings * 100.0) / 100.0);
        summary.put("currency", "TND");
        return ResponseEntity.ok(summary);
    }
}
