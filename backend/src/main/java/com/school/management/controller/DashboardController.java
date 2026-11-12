package com.school.management.controller;

import com.school.management.entity.Announcement;
import com.school.management.entity.Attendance;
import com.school.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private SchoolClassRepository schoolClassRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<Map<String, Object>> getStaffSummary() {
        long students = studentRepository.count();
        long teachers = teacherRepository.count();
        long classes = schoolClassRepository.count();
        long subjects = subjectRepository.count();
        long parentsCount = parentRepository.count();
        long homeworkCount = homeworkRepository.count();

        List<Attendance> todayAttendance = attendanceRepository.findByDate(new Date());
        int attendanceRate = 0;
        if (!todayAttendance.isEmpty()) {
            long presentCount = todayAttendance.stream()
                    .filter(a -> "حاضر".equals(a.getStatus()) || "Present".equalsIgnoreCase(a.getStatus()))
                    .count();
            attendanceRate = (int) Math.round((presentCount * 100.0) / todayAttendance.size());
        }

        List<Announcement> announcements = announcementRepository
                .findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "id")))
                .getContent();

        Map<String, Object> summary = new HashMap<>();
        summary.put("students", students);
        summary.put("teachers", teachers);
        summary.put("classes", classes);
        summary.put("subjects", subjects);
        summary.put("parentsCount", parentsCount);
        summary.put("homeworkCount", homeworkCount);
        summary.put("attendanceRate", attendanceRate);
        summary.put("announcements", announcements);

        return ResponseEntity.ok(summary);
    }
}

