package com.school.management.controller;

import jakarta.validation.Valid;
import com.school.management.entity.Attendance;
import com.school.management.entity.SchoolClass;
import com.school.management.entity.Student;
import com.school.management.repository.SchoolClassRepository;
import com.school.management.repository.StudentRepository;
import com.school.management.security.UserDetailsImpl;
import com.school.management.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SchoolClassRepository schoolClassRepository;

    private boolean isTeacherOnly() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMINISTRATOR"));
            boolean isTeacher = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("TEACHER"));
            return isTeacher && !isAdmin;
        }
        return false;
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        return null;
    }

    private boolean isStudentInTeacherClasses(Long studentId, Long teacherId) {
        List<SchoolClass> classes = schoolClassRepository.findByTeacherId(teacherId);
        Set<Long> classIds = classes.stream().map(SchoolClass::getId).collect(Collectors.toSet());
        return studentRepository.findById(studentId)
                .map(s -> s.getSchoolClass() != null && classIds.contains(s.getSchoolClass().getId()))
                .orElse(false);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<Attendance> getAllAttendance() {
        if (isTeacherOnly()) {
            Long teacherId = getCurrentUserId();
            List<SchoolClass> classes = schoolClassRepository.findByTeacherId(teacherId);
            Set<Long> allowedStudentIds = new HashSet<>();
            for (SchoolClass sc : classes) {
                if (sc.getStudents() != null) {
                    for (Student s : sc.getStudents()) {
                        allowedStudentIds.add(s.getId());
                    }
                }
            }
            return attendanceService.getAllAttendance().stream()
                    .filter(a -> a.getStudent() != null && allowedStudentIds.contains(a.getStudent().getId()))
                    .collect(Collectors.toList());
        }
        return attendanceService.getAllAttendance();
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER') or hasAuthority('PARENT') or hasAuthority('STUDENT')")
    public List<Attendance> getAttendanceByStudent(@PathVariable Long studentId) {
        if (isTeacherOnly()) {
            Long teacherId = getCurrentUserId();
            if (!isStudentInTeacherClasses(studentId, teacherId)) {
                throw new AccessDeniedException("هذا الطالب لا ينتمي إلى أحد فصولك المسندة");
            }
        }
        return attendanceService.getAttendanceByStudentId(studentId);
    }

    @GetMapping("/date/{date}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<Attendance> getAttendanceByDate(@PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") Date date) {
        List<Attendance> list = attendanceService.getAttendanceByDate(date);
        if (isTeacherOnly()) {
            Long teacherId = getCurrentUserId();
            List<SchoolClass> classes = schoolClassRepository.findByTeacherId(teacherId);
            Set<Long> allowedClassIds = classes.stream().map(SchoolClass::getId).collect(Collectors.toSet());
            return list.stream()
                    .filter(a -> a.getStudent() != null && a.getStudent().getSchoolClass() != null && allowedClassIds.contains(a.getStudent().getSchoolClass().getId()))
                    .collect(Collectors.toList());
        }
        return list;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public Attendance createAttendance(@Valid @RequestBody Attendance attendance) {
        if (attendance.getStudent() != null && attendance.getStudent().getId() != null) {
            studentRepository.findById(attendance.getStudent().getId()).ifPresent(attendance::setStudent);
        }
        if (isTeacherOnly()) {
            Long teacherId = getCurrentUserId();
            Long studentId = attendance.getStudent() != null ? attendance.getStudent().getId() : null;
            if (studentId == null || !isStudentInTeacherClasses(studentId, teacherId)) {
                throw new AccessDeniedException("ليس لديك صلاحية لتسجيل حضور هذا الطالب / Student is not in your assigned classes");
            }
        }
        if (attendance.getDate() == null) {
            attendance.setDate(new Date());
        }
        return attendanceService.saveAttendance(attendance);
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public List<Attendance> createBulkAttendance(@Valid @RequestBody List<Attendance> attendances) {
        Long teacherId = isTeacherOnly() ? getCurrentUserId() : null;
        for (Attendance a : attendances) {
            if (a.getStudent() != null && a.getStudent().getId() != null) {
                studentRepository.findById(a.getStudent().getId()).ifPresent(a::setStudent);
                if (teacherId != null && !isStudentInTeacherClasses(a.getStudent().getId(), teacherId)) {
                    throw new AccessDeniedException("أحد الطلاب لا ينتمي لفصولك المسندة");
                }
            }
        }
        return attendanceService.saveAllAttendance(attendances);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<Attendance> updateAttendance(@PathVariable Long id, @Valid @RequestBody Attendance attendanceDetails) {
        return attendanceService.getAttendanceById(id)
                .map(attendance -> {
                    if (isTeacherOnly()) {
                        Long teacherId = getCurrentUserId();
                        if (attendance.getStudent() == null || !isStudentInTeacherClasses(attendance.getStudent().getId(), teacherId)) {
                            throw new AccessDeniedException("ليس لديك صلاحية لتعديل حضور هذا الطالب");
                        }
                    }
                    if (attendanceDetails.getStudent() != null && attendanceDetails.getStudent().getId() != null) {
                        studentRepository.findById(attendanceDetails.getStudent().getId()).ifPresent(attendance::setStudent);
                    }
                    if (attendanceDetails.getStatus() != null) attendance.setStatus(attendanceDetails.getStatus());
                    if (attendanceDetails.getDate() != null) attendance.setDate(attendanceDetails.getDate());
                    if (attendanceDetails.getRemarks() != null) attendance.setRemarks(attendanceDetails.getRemarks());
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
