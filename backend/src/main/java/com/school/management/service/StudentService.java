package com.school.management.service;

import com.school.management.entity.*;
import com.school.management.payload.request.StudentRequest;
import com.school.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private SchoolClassRepository schoolClassRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private HomeworkSubmissionRepository homeworkSubmissionRepository;

    @Autowired
    private PasswordEncoder encoder;

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }

    @Transactional
    public Student createStudent(StudentRequest request) {
        // Handle username uniqueness
        String username = request.getUsername();
        if (username == null || username.trim().isEmpty()) {
            username = (request.getFirstName() + (int)(Math.random() * 9000 + 1000)).toLowerCase().replaceAll("\\s+", "");
        }
        if (userRepository.existsByUsername(username)) {
            username = username + (int)(Math.random() * 900 + 100);
        }

        // Handle email uniqueness
        String email = request.getEmail();
        if (email == null || email.trim().isEmpty()) {
            email = username + "@student.school";
        }
        if (userRepository.existsByEmail(email)) {
            email = username + "_" + System.currentTimeMillis() % 10000 + "@student.school";
        }

        // 1. Create User
        User user = new User();
        user.setUsername(username);
        String pwd = (request.getPassword() != null && !request.getPassword().trim().isEmpty()) ? request.getPassword().trim() : "student123";
        user.setPassword(encoder.encode(pwd));
        user.setEmail(email);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        Role studentRole = roleRepository.findByName(RoleName.STUDENT)
                .orElseThrow(() -> new RuntimeException("Error: STUDENT Role is not found in database."));
        Set<Role> roles = new HashSet<>();
        roles.add(studentRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // 2. Create Student
        Student student = new Student();
        student.setUser(savedUser);
        student.setStatus(request.getStatus() != null ? request.getStatus() : "نشط");
        student.setEmergencyContact(request.getEmergencyContact());
        student.setEnrollmentDate(new Date());

        if (request.getParentId() != null) {
            Parent parent = parentRepository.findById(request.getParentId()).orElse(null);
            student.setParent(parent);
        }

        if (request.getClassId() != null) {
            SchoolClass schoolClass = schoolClassRepository.findById(request.getClassId()).orElse(null);
            student.setSchoolClass(schoolClass);
        }

        return studentRepository.save(student);
    }

    @Transactional
    public Student updateStudent(Long id, StudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + id));

        // Update User
        User user = student.getUser();
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty() && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new IllegalArgumentException("اسم المستخدم مستخدم بالفعل / Username is already taken");
            }
            user.setUsername(request.getUsername().trim());
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("البريد الإلكتروني مستخدم بالفعل / Email is already in use");
            }
            user.setEmail(request.getEmail().trim());
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(encoder.encode(request.getPassword().trim()));
        }
        userRepository.save(user);

        // Update Student
        if (request.getStatus() != null) student.setStatus(request.getStatus());
        if (request.getEmergencyContact() != null) student.setEmergencyContact(request.getEmergencyContact());

        if (request.getParentId() != null) {
            Parent parent = parentRepository.findById(request.getParentId()).orElse(null);
            student.setParent(parent);
        } else {
            student.setParent(null);
        }

        if (request.getClassId() != null) {
            SchoolClass schoolClass = schoolClassRepository.findById(request.getClassId()).orElse(null);
            student.setSchoolClass(schoolClass);
        } else {
            student.setSchoolClass(null);
        }

        return studentRepository.save(student);
    }

    public Student saveStudent(Student student) {
        return studentRepository.save(student);
    }

    @Transactional
    public void deleteStudent(Long id) {
        // Safe delete: Clean up dependent records first to prevent foreign key errors
        try {
            attendanceRepository.deleteAll(attendanceRepository.findByStudentId(id));
            gradeRepository.deleteAll(gradeRepository.findByStudentId(id));
            homeworkSubmissionRepository.deleteAll(homeworkSubmissionRepository.findByStudentId(id));
        } catch (Exception ignored) {}

        studentRepository.deleteById(id);
        userRepository.deleteById(id);
    }
}
