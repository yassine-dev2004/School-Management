package com.school.management.config;

import com.school.management.entity.*;
import com.school.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private SchoolClassRepository schoolClassRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DailyLessonLogRepository dailyLessonLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            // 1. Seed Roles if missing
            for (RoleName roleName : RoleName.values()) {
                if (roleRepository.findByName(roleName).isEmpty()) {
                    Role role = new Role();
                    role.setName(roleName);
                    roleRepository.save(role);
                }
            }

            // 2. Seed Default Administrator if missing
            if (!userRepository.existsByUsername("admin")) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@school.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setFirstName("مدير");
                admin.setLastName("النظام");
                admin.setPhone("0000000000");

                Set<Role> roles = new HashSet<>();
                roleRepository.findByName(RoleName.ADMINISTRATOR).ifPresent(roles::add);
                admin.setRoles(roles);

                userRepository.save(admin);
                System.out.println(">>> DataSeeder: Initial Admin account 'admin' / 'admin123' created successfully.");
            }

            // 3. Seed Default Teacher if missing or unlinked
            User teacherUser = userRepository.findByUsername("teacher").orElseGet(() -> {
                User u = new User();
                u.setUsername("teacher");
                u.setEmail("teacher@school.com");
                u.setPassword(passwordEncoder.encode("teacher123"));
                u.setFirstName("أحمد");
                u.setLastName("المنصوري");
                u.setPhone("20111222");

                Set<Role> roles = new HashSet<>();
                roleRepository.findByName(RoleName.TEACHER).ifPresent(roles::add);
                u.setRoles(roles);
                return userRepository.save(u);
            });

            if (!teacherRepository.existsById(teacherUser.getId())) {
                Teacher teacher = new Teacher();
                teacher.setUser(teacherUser);
                teacher.setQualification("أستاذ تعليم ابتدائي أول");
                teacher.setJoiningDate("2024-09-15");

                // Attach available subjects
                java.util.List<Subject> allSubjects = subjectRepository.findAll();
                if (!allSubjects.isEmpty()) {
                    teacher.setSubjects(new HashSet<>(allSubjects));
                }

                Teacher savedTeacher = teacherRepository.save(teacher);

                // Assign homeroom teacher to first class if unassigned
                java.util.List<SchoolClass> classes = schoolClassRepository.findAll();
                for (SchoolClass sc : classes) {
                    if (sc.getTeacher() == null) {
                        sc.setTeacher(savedTeacher);
                        schoolClassRepository.save(sc);
                        break;
                    }
                }
                if (!classes.isEmpty() && classes.stream().noneMatch(c -> c.getTeacher() != null && c.getTeacher().getId().equals(savedTeacher.getId()))) {
                    SchoolClass sc = classes.get(0);
                    sc.setTeacher(savedTeacher);
                    schoolClassRepository.save(sc);
                }

                System.out.println(">>> DataSeeder: Linked Teacher profile for 'teacher' / 'teacher123' successfully.");
            }

            // 4. Seed Default Parent if missing or unlinked
            User parentUser = userRepository.findByUsername("parent").orElseGet(() -> {
                User u = new User();
                u.setUsername("parent");
                u.setEmail("parent@school.com");
                u.setPassword(passwordEncoder.encode("parent123"));
                u.setFirstName("محمد");
                u.setLastName("التونسي");
                u.setPhone("98123456");

                Set<Role> roles = new HashSet<>();
                roleRepository.findByName(RoleName.PARENT).ifPresent(roles::add);
                u.setRoles(roles);
                return userRepository.save(u);
            });

            Parent parent = parentRepository.findById(parentUser.getId()).orElseGet(() -> {
                Parent p = new Parent();
                p.setUser(parentUser);
                p.setOccupation("مهندس");
                p.setAddress("تونس، المنار");
                return parentRepository.save(p);
            });

            // Ensure parent has at least one child linked
            java.util.List<Student> students = studentRepository.findAll();
            if (!students.isEmpty()) {
                boolean hasLinkedChild = students.stream().anyMatch(s -> s.getParent() != null && s.getParent().getId().equals(parent.getId()));
                if (!hasLinkedChild) {
                    Student firstStudent = students.get(0);
                    firstStudent.setParent(parent);
                    studentRepository.save(firstStudent);
                    System.out.println(">>> DataSeeder: Linked Student '" + firstStudent.getUser().getFirstName() + "' to Parent 'parent'.");
                }
            }

            // Seed sample daily lesson log if empty
            if (dailyLessonLogRepository.count() == 0 && !schoolClassRepository.findAll().isEmpty()) {
                SchoolClass sc = schoolClassRepository.findAll().get(0);
                DailyLessonLog sampleLog = new DailyLessonLog();
                sampleLog.setSchoolClass(sc);
                if (!subjectRepository.findAll().isEmpty()) {
                    sampleLog.setSubject(subjectRepository.findAll().get(0));
                }
                sampleLog.setDate(new java.util.Date());
                sampleLog.setTitle("الدرس 4: التراكيب النحوية وإعراب الجملة");
                sampleLog.setSummary("تم شرح درس المفعول به والمفعول المطلق مع إنجاز تمارين تطبيقية في القسم وكراس الأنشطة.");
                sampleLog.setHomeworkAssigned("إنجاز التمرين عدد 3 و 4 صفحة 28 من كراس التمارين.");
                sampleLog.setPeriod("الحصة الصباحية (08:00 - 10:00)");
                if (!teacherRepository.findAll().isEmpty()) {
                    sampleLog.setTeacher(teacherRepository.findAll().get(0));
                }
                dailyLessonLogRepository.save(sampleLog);
                System.out.println(">>> DataSeeder: Sample daily lesson log created successfully.");
            }
        } catch (Exception e) {
            System.err.println(">>> DataSeeder warning: " + e.getMessage());
        }
    }
}
