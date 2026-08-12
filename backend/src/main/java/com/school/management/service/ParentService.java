package com.school.management.service;

import com.school.management.entity.*;
import com.school.management.payload.request.ParentRequest;
import com.school.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ParentService {

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private PasswordEncoder encoder;

    public List<Parent> getAllParents() {
        return parentRepository.findAll();
    }

    public Optional<Parent> getParentById(Long id) {
        return parentRepository.findById(id);
    }

    public Optional<Parent> getParentByUserId(Long userId) {
        return parentRepository.findByUserId(userId);
    }

    public List<Student> getChildrenByParentId(Long parentId) {
        return parentRepository.findById(parentId)
                .map(Parent::getChildren)
                .orElse(Collections.emptyList());
    }

    public List<Student> getChildrenByUserId(Long userId) {
        return parentRepository.findByUserId(userId)
                .map(Parent::getChildren)
                .orElse(Collections.emptyList());
    }

    public Map<String, Object> getParentDashboard(Long userId) {
        Map<String, Object> dashboard = new HashMap<>();

        Optional<Parent> parentOpt = parentRepository.findByUserId(userId);
        if (parentOpt.isEmpty()) {
            dashboard.put("children", Collections.emptyList());
            dashboard.put("totalChildren", 0);
            return dashboard;
        }

        Parent parent = parentOpt.get();
        List<Student> children = parent.getChildren() != null ? parent.getChildren() : Collections.emptyList();

        // Build children data with grades and attendance
        List<Map<String, Object>> childrenData = new ArrayList<>();
        int totalGrades = 0;
        double totalScore = 0;
        int totalPresent = 0;
        int totalAbsent = 0;
        int totalAttendance = 0;

        for (Student child : children) {
            Map<String, Object> childData = new HashMap<>();
            childData.put("id", child.getId());
            childData.put("firstName", child.getUser() != null ? child.getUser().getFirstName() : "");
            childData.put("lastName", child.getUser() != null ? child.getUser().getLastName() : "");
            childData.put("email", child.getUser() != null ? child.getUser().getEmail() : "");
            childData.put("status", child.getStatus());
            childData.put("emergencyContact", child.getEmergencyContact());

            // Class info
            if (child.getSchoolClass() != null) {
                Map<String, Object> classInfo = new HashMap<>();
                classInfo.put("id", child.getSchoolClass().getId());
                classInfo.put("name", child.getSchoolClass().getName());
                classInfo.put("section", child.getSchoolClass().getSection());
                childData.put("schoolClass", classInfo);
            }

            // Grades
            List<Grade> grades = gradeRepository.findByStudentId(child.getId());
            List<Map<String, Object>> gradesList = new ArrayList<>();
            for (Grade g : grades) {
                Map<String, Object> gradeMap = new HashMap<>();
                gradeMap.put("id", g.getId());
                gradeMap.put("subjectName", g.getSubject() != null ? g.getSubject().getName() : "");
                gradeMap.put("examType", g.getExamType());
                gradeMap.put("score", g.getScore());
                gradeMap.put("comments", g.getComments());
                gradeMap.put("recordedDate", g.getRecordedDate());
                gradesList.add(gradeMap);

                if (g.getScore() != null) {
                    totalScore += g.getScore();
                    totalGrades++;
                }
            }
            childData.put("grades", gradesList);

            // Attendance
            List<Attendance> attendanceList = attendanceRepository.findByStudentId(child.getId());
            List<Map<String, Object>> attendanceData = new ArrayList<>();
            for (Attendance a : attendanceList) {
                Map<String, Object> attMap = new HashMap<>();
                attMap.put("id", a.getId());
                attMap.put("date", a.getDate());
                attMap.put("status", a.getStatus());
                attendanceData.add(attMap);

                totalAttendance++;
                if ("Present".equalsIgnoreCase(a.getStatus()) || "حاضر".equals(a.getStatus())) {
                    totalPresent++;
                } else if ("Absent".equalsIgnoreCase(a.getStatus()) || "غائب".equals(a.getStatus())) {
                    totalAbsent++;
                }
            }
            childData.put("attendance", attendanceData);

            childrenData.add(childData);
        }

        dashboard.put("parentId", parent.getId());
        dashboard.put("children", childrenData);
        dashboard.put("totalChildren", children.size());
        dashboard.put("averageScore", totalGrades > 0 ? Math.round(totalScore / totalGrades * 10.0) / 10.0 : 0);
        dashboard.put("totalPresent", totalPresent);
        dashboard.put("totalAbsent", totalAbsent);
        dashboard.put("totalAttendanceRecords", totalAttendance);
        dashboard.put("attendanceRate", totalAttendance > 0 ? Math.round((double) totalPresent / totalAttendance * 100.0 * 10.0) / 10.0 : 0);

        return dashboard;
    }

    @Transactional
    public Parent createParent(ParentRequest request) {
        // 1. Create User
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(encoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        Role parentRole = roleRepository.findByName(RoleName.PARENT)
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        Set<Role> roles = new HashSet<>();
        roles.add(parentRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // 2. Create Parent
        Parent parent = new Parent();
        parent.setUser(savedUser);
        parent.setOccupation(request.getOccupation());
        parent.setAddress(request.getAddress());

        return parentRepository.save(parent);
    }

    @Transactional
    public Parent updateParent(Long id, ParentRequest request) {
        Parent parent = parentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parent not found"));

        // Update User
        User user = parent.getUser();
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getUsername() != null) user.setUsername(request.getUsername());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(encoder.encode(request.getPassword()));
        }
        userRepository.save(user);

        // Update Parent
        if (request.getOccupation() != null) parent.setOccupation(request.getOccupation());
        if (request.getAddress() != null) parent.setAddress(request.getAddress());

        return parentRepository.save(parent);
    }

    public Parent saveParent(Parent parent) {
        return parentRepository.save(parent);
    }

    @Transactional
    public void deleteParent(Long id) {
        parentRepository.deleteById(id);
        userRepository.deleteById(id);
    }
}
