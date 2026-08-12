package com.school.management.controller;

import jakarta.validation.Valid;
import com.school.management.entity.Attendance;
import com.school.management.repository.StudentRepository;
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

    @Autowired
    private StudentRepository studentRepository;

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
        if (attendance.getStudent() != null && attendance.getStudent().getId() != null) {
            studentRepository.findById(attendance.getStudent().getId()).ifPresent(attendance::setStudent);
        }
        if (attendance.getDate() == null) {
            attendance.setDate(new Date());
        }
        return attendanceService.saveAttendance(attendance);
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<Attendance> createBulkAttendance(@Valid @RequestBody List<Attendance> attendances) {
        for (Attendance a : attendances) {
            if (a.getStudent() != null && a.getStudent().getId() != null) {
                studentRepository.findById(a.getStudent().getId()).ifPresent(a::setStudent);
            }
        }
        return attendanceService.saveAllAttendance(attendances);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<Attendance> updateAttendance(@PathVariable Long id, @Valid @RequestBody Attendance attendanceDetails) {
        return attendanceService.getAttendanceById(id)
                .map(attendance -> {
                    if (attendanceDetails.getStudent() != null && attendanceDetails.getStudent().getId() != null) {
                        studentRepository.findById(attendanceDetails.getStudent().getId()).ifPresent(attendance::setStudent);
                    }
                    if (attendanceDetails.getStatus() != null) attendance.setStatus(attendanceDetails.getStatus());
                    if (attendanceDetails.getDate() != null) attendance.setDate(attendanceDetails.getDate());
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
