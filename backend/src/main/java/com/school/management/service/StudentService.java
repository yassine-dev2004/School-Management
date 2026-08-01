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
    private PasswordEncoder encoder;

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }

    @Transactional
    public Student createStudent(StudentRequest request) {
        // 1. Create User
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(encoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        Role studentRole = roleRepository.findByName(RoleName.STUDENT)
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
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
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Update User
        User user = student.getUser();
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getUsername() != null) user.setUsername(request.getUsername());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(encoder.encode(request.getPassword()));
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
        studentRepository.deleteById(id);
        userRepository.deleteById(id);
    }
}
