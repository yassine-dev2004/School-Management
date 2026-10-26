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
    private SubjectRepository subjectRepository;

    @Autowired
    private SchoolClassRepository schoolClassRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;

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
        String username = request.getUsername();
        if (username == null || username.trim().isEmpty()) {
            username = (request.getFirstName() + (int)(Math.random() * 9000 + 1000)).toLowerCase().replaceAll("\\s+", "");
        }
        if (userRepository.existsByUsername(username)) {
            username = username + (int)(Math.random() * 900 + 100);
        }

        String email = request.getEmail();
        if (email == null || email.trim().isEmpty()) {
            email = username + "@teacher.school";
        }
        if (userRepository.existsByEmail(email)) {
            email = username + "_" + System.currentTimeMillis() % 10000 + "@teacher.school";
        }

        // 1. Create User
        User user = new User();
        user.setUsername(username);
        String pwd = (request.getPassword() != null && !request.getPassword().trim().isEmpty()) ? request.getPassword().trim() : "teacher123";
        user.setPassword(encoder.encode(pwd));
        user.setEmail(email);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        Role teacherRole = roleRepository.findByName(RoleName.TEACHER)
                .orElseThrow(() -> new RuntimeException("Error: TEACHER Role is not found in database."));
        Set<Role> roles = new HashSet<>();
        roles.add(teacherRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // 2. Create Teacher
        Teacher teacher = new Teacher();
        teacher.setUser(savedUser);
        teacher.setQualification(request.getQualification());
        teacher.setJoiningDate(request.getJoiningDate());

        if (request.getSubjectIds() != null && !request.getSubjectIds().isEmpty()) {
            Set<Subject> subjects = new HashSet<>(subjectRepository.findAllById(request.getSubjectIds()));
            teacher.setSubjects(subjects);
        }

        return teacherRepository.save(teacher);
    }

    @Transactional
    public Teacher updateTeacher(Long id, TeacherRequest request) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found with ID: " + id));

        // Update User
        User user = teacher.getUser();
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

        // Update Teacher
        if (request.getQualification() != null) teacher.setQualification(request.getQualification());
        if (request.getJoiningDate() != null) teacher.setJoiningDate(request.getJoiningDate());

        if (request.getSubjectIds() != null) {
            Set<Subject> subjects = new HashSet<>(subjectRepository.findAllById(request.getSubjectIds()));
            teacher.setSubjects(subjects);
        }

        return teacherRepository.save(teacher);
    }

    public Teacher saveTeacher(Teacher teacher) {
        return teacherRepository.save(teacher);
    }

    @Transactional
    public void deleteTeacher(Long id) {
        // Safe delete: Clear homeroom teacher from associated classes
        Optional<Teacher> teacherOpt = teacherRepository.findById(id);
        if (teacherOpt.isPresent()) {
            Teacher teacher = teacherOpt.get();
            if (teacher.getClasses() != null) {
                for (SchoolClass sc : teacher.getClasses()) {
                    sc.setTeacher(null);
                    schoolClassRepository.save(sc);
                }
            }
            teacher.getSubjects().clear();
            teacherRepository.save(teacher);
        }

        // Disassociate homework from teacher
        try {
            List<Homework> homeworks = homeworkRepository.findByTeacherId(id);
            for (Homework h : homeworks) {
                h.setTeacher(null);
                homeworkRepository.save(h);
            }
        } catch (Exception ignored) {}

        teacherRepository.deleteById(id);
        try {
            userRepository.deleteUserRolesByUserId(id);
            userRepository.deleteUserById(id);
        } catch (Exception ignored) {}
    }
}
