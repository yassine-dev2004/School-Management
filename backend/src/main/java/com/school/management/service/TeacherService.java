package com.school.management.service;

import com.school.management.entity.*;
import com.school.management.payload.request.TeacherRequest;
import com.school.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class TeacherService {

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder encoder;

    public List<Teacher> getAllTeachers() {
        return teacherRepository.findAll();
    }

    public Optional<Teacher> getTeacherById(Long id) {
        return teacherRepository.findById(id);
    }

    @Transactional
    public Teacher createTeacher(TeacherRequest request) {
        // 1. Create User
        User user = new User();
        user.setUsername(request.getUsername());
        String pwd = (request.getPassword() != null && !request.getPassword().isEmpty()) ? request.getPassword() : "teacher123";
        String email = (request.getEmail() != null && !request.getEmail().isEmpty()) ? request.getEmail() : request.getUsername() + "@teacher.school";
        user.setPassword(encoder.encode(pwd));
        user.setEmail(email);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        Role teacherRole = roleRepository.findByName(RoleName.TEACHER)
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        Set<Role> roles = new HashSet<>();
        roles.add(teacherRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // 2. Create Teacher
        Teacher teacher = new Teacher();
        teacher.setUser(savedUser);
        teacher.setQualification(request.getQualification());
        teacher.setJoiningDate(request.getJoiningDate());

        return teacherRepository.save(teacher);
    }

    @Transactional
    public Teacher updateTeacher(Long id, TeacherRequest request) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // Update User
        User user = teacher.getUser();
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getUsername() != null) user.setUsername(request.getUsername());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(encoder.encode(request.getPassword()));
        }
        userRepository.save(user);

        // Update Teacher
        if (request.getQualification() != null) teacher.setQualification(request.getQualification());
        if (request.getJoiningDate() != null) teacher.setJoiningDate(request.getJoiningDate());

        return teacherRepository.save(teacher);
    }

    public Teacher saveTeacher(Teacher teacher) {
        return teacherRepository.save(teacher);
    }

    @Transactional
    public void deleteTeacher(Long id) {
        teacherRepository.deleteById(id);
        userRepository.deleteById(id);
    }
}
