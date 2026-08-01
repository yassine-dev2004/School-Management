package com.school.management.controller;

import com.school.management.entity.Role;
import com.school.management.entity.RoleName;
import com.school.management.entity.User;
import com.school.management.payload.request.LoginRequest;
import com.school.management.payload.request.SignupRequest;
import com.school.management.payload.response.JwtResponse;
import com.school.management.payload.response.MessageResponse;
import com.school.management.repository.RoleRepository;
import com.school.management.repository.UserRepository;
import com.school.management.security.JwtUtils;
import com.school.management.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();    
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt, 
                                                 userDetails.getId(), 
                                                 userDetails.getUsername(), 
                                                 userDetails.getEmail(), 
                                                 roles));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setFirstName(signUpRequest.getFirstName());
        user.setLastName(signUpRequest.getLastName());

        Set<String> strRoles = signUpRequest.getRoles();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null) {
            Role userRole = roleRepository.findByName(RoleName.STUDENT)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            roles.add(userRole);
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                case "admin":
                    Role adminRole = roleRepository.findByName(RoleName.ADMINISTRATOR)
                            .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                    roles.add(adminRole);
                    break;
                case "teacher":
                    Role modRole = roleRepository.findByName(RoleName.TEACHER)
                            .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                    roles.add(modRole);
                    break;
                case "parent":
                    Role parentRole = roleRepository.findByName(RoleName.PARENT)
                            .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                    roles.add(parentRole);
                    break;
                default:
                    Role userRole = roleRepository.findByName(RoleName.STUDENT)
                            .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                    roles.add(userRole);
                }
            });
        }

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @GetMapping("/seed")
    public ResponseEntity<?> seedDatabase() {
        // Seed Roles
        if (!roleRepository.findByName(RoleName.ADMINISTRATOR).isPresent()) {
            roleRepository.save(new Role(null, RoleName.ADMINISTRATOR));
        }
        if (!roleRepository.findByName(RoleName.TEACHER).isPresent()) {
            roleRepository.save(new Role(null, RoleName.TEACHER));
        }
        if (!roleRepository.findByName(RoleName.PARENT).isPresent()) {
            roleRepository.save(new Role(null, RoleName.PARENT));
        }
        if (!roleRepository.findByName(RoleName.STUDENT).isPresent()) {
            roleRepository.save(new Role(null, RoleName.STUDENT));
        }

        // Seed Admin User
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@school.com");
            admin.setPassword(encoder.encode("admin123"));
            admin.setFirstName("System");
            admin.setLastName("Admin");
            admin.setPhone("0000000000");
            
            Set<Role> roles = new HashSet<>();
            roles.add(roleRepository.findByName(RoleName.ADMINISTRATOR).get());
            admin.setRoles(roles);
            
            userRepository.save(admin);
        }

        // Seed Parent User
        if (!userRepository.existsByUsername("parent")) {
            User parent = new User();
            parent.setUsername("parent");
            parent.setEmail("parent@school.com");
            parent.setPassword(encoder.encode("parent123"));
            parent.setFirstName("Demo");
            parent.setLastName("Parent");
            parent.setPhone("0000000001");
            
            Set<Role> roles = new HashSet<>();
            roles.add(roleRepository.findByName(RoleName.PARENT).get());
            parent.setRoles(roles);
            
            userRepository.save(parent);
            return ResponseEntity.ok(new MessageResponse("Database seeded with roles, admin user, and parent user!"));
        }
        
        return ResponseEntity.ok(new MessageResponse("Database already seeded."));
    }
}
