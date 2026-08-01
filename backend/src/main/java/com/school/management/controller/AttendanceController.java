package com.school.management.controller;

import jakarta.validation.Valid;
import com.school.management.entity.Attendance;
import com.school.management.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<Attendance> getAllAttendance() {
        return attendanceService.getAllAttendance();
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER') or hasAuthority('PARENT') or hasAuthority('STUDENT')")
    public List<Attendance> getAttendanceByStudent(@PathVariable Long studentId) {
        return attendanceService.getAttendanceByStudentId(studentId);
    }

    @GetMapping("/date/{date}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<Attendance> getAttendanceByDate(@PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") Date date) {
        return attendanceService.getAttendanceByDate(date);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public Attendance createAttendance(@Valid @RequestBody Attendance attendance) {
        return attendanceService.saveAttendance(attendance);
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<Attendance> createBulkAttendance(@Valid @RequestBody List<Attendance> attendances) {
        return attendanceService.saveAllAttendance(attendances);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<Attendance> updateAttendance(@PathVariable Long id, @Valid @RequestBody Attendance attendanceDetails) {
        return attendanceService.getAttendanceById(id)
                .map(attendance -> {
                    attendance.setStatus(attendanceDetails.getStatus());
                    attendance.setDate(attendanceDetails.getDate());
                    return ResponseEntity.ok(attendanceService.saveAttendance(attendance));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> deleteAttendance(@PathVariable Long id) {
        return attendanceService.getAttendanceById(id)
                .map(attendance -> {
                    attendanceService.deleteAttendance(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
