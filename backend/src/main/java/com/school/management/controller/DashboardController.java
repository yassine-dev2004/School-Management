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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

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

    @Autowired
    private TeacherAttendanceRepository teacherAttendanceRepository;

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER')")
    public ResponseEntity<Map<String, Object>> getStaffSummary() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isTeacher = false;
        Long teacherId = null;
        if (auth != null && auth.getPrincipal() instanceof com.school.management.security.UserDetailsImpl) {
            com.school.management.security.UserDetailsImpl userDetails = (com.school.management.security.UserDetailsImpl) auth.getPrincipal();
            boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMINISTRATOR"));
            boolean hasTeacherRole = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("TEACHER"));
            if (hasTeacherRole && !isAdmin) {
                isTeacher = true;
                teacherId = userDetails.getId();
            }
        }

        Map<String, Object> summary = new HashMap<>();

        if (isTeacher) {
            List<com.school.management.entity.SchoolClass> myClasses = schoolClassRepository.findByTeacherId(teacherId);
            long classCount = myClasses.size();
            long studentCount = 0;
            Set<Long> myStudentIds = new HashSet<>();
            for (com.school.management.entity.SchoolClass sc : myClasses) {
                if (sc.getStudents() != null) {
                    studentCount += sc.getStudents().size();
                    for (com.school.management.entity.Student s : sc.getStudents()) {
                        myStudentIds.add(s.getId());
                    }
                }
            }
            long subjectCount = teacherRepository.findById(teacherId)
                    .map(t -> (long) t.getSubjects().size())
                    .orElse(0L);

            List<Attendance> todayAttendance = attendanceRepository.findByDate(new Date());
            List<Attendance> myClassAttendance = todayAttendance.stream()
                    .filter(a -> a.getStudent() != null && myStudentIds.contains(a.getStudent().getId()))
                    .collect(java.util.stream.Collectors.toList());

            int attendanceRate = 0;
            if (!myClassAttendance.isEmpty()) {
                long presentCount = myClassAttendance.stream()
                        .filter(a -> "حاضر".equals(a.getStatus()) || "Present".equalsIgnoreCase(a.getStatus()))
                        .count();
                attendanceRate = (int) Math.round((presentCount * 100.0) / myClassAttendance.size());
            }

            boolean checkedInToday = false;
            try {
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                sdf.setTimeZone(TimeZone.getTimeZone("Africa/Tunis"));
                Date today = sdf.parse(sdf.format(new Date()));
                checkedInToday = teacherAttendanceRepository.findByTeacherIdAndDate(teacherId, today).isPresent();
            } catch (Exception ignored) {}

            summary.put("isTeacher", true);
            summary.put("students", studentCount);
            summary.put("teachers", 1);
            summary.put("classes", classCount);
            summary.put("subjects", subjectCount);
            summary.put("attendanceRate", attendanceRate);
            summary.put("checkedInToday", checkedInToday);
            summary.put("homeworkCount", homeworkRepository.count());
            summary.put("parentsCount", parentRepository.count());
        } else {
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

            summary.put("isTeacher", false);
            summary.put("students", students);
            summary.put("teachers", teachers);
            summary.put("classes", classes);
            summary.put("subjects", subjects);
            summary.put("parentsCount", parentsCount);
            summary.put("homeworkCount", homeworkCount);
            summary.put("attendanceRate", attendanceRate);
        }

        List<Announcement> announcements = announcementRepository
                .findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "id")))
                .getContent();
        summary.put("announcements", announcements);

        return ResponseEntity.ok(summary);
    }
}

