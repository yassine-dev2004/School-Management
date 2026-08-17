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
        } catch (Exception e) {
            System.err.println(">>> DataSeeder warning: " + e.getMessage());
        }
    }
}
