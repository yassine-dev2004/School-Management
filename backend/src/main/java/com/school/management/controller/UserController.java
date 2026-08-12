package com.school.management.controller;

import jakarta.validation.Valid;
import com.school.management.entity.User;
import com.school.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER') or hasAuthority('PARENT') or hasAuthority('STUDENT')")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getMyProfile() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof com.school.management.security.UserDetailsImpl)) {
            return ResponseEntity.status(401).build();
        }
        com.school.management.security.UserDetailsImpl userDetails = (com.school.management.security.UserDetailsImpl) auth.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateMyProfile(@RequestBody User userDetails) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof com.school.management.security.UserDetailsImpl)) {
            return ResponseEntity.status(401).build();
        }
        com.school.management.security.UserDetailsImpl currentUser = (com.school.management.security.UserDetailsImpl) auth.getPrincipal();
        return userRepository.findById(currentUser.getId())
                .map(user -> {
                    if (userDetails.getFirstName() != null) user.setFirstName(userDetails.getFirstName());
                    if (userDetails.getLastName() != null) user.setLastName(userDetails.getLastName());
                    if (userDetails.getPhone() != null) user.setPhone(userDetails.getPhone());
                    if (userDetails.getEmail() != null) user.setEmail(userDetails.getEmail());
                    if (userDetails.getProfilePictureUrl() != null) user.setProfilePictureUrl(userDetails.getProfilePictureUrl());
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('TEACHER') or hasAuthority('PARENT') or hasAuthority('STUDENT')")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody User userDetails) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setFirstName(userDetails.getFirstName());
                    user.setLastName(userDetails.getLastName());
                    user.setPhone(userDetails.getPhone());
                    user.setProfilePictureUrl(userDetails.getProfilePictureUrl());
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
