package com.school.management.service;

import com.school.management.entity.*;
import com.school.management.payload.request.ParentRequest;
import com.school.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class ParentService {

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder encoder;

    public List<Parent> getAllParents() {
        return parentRepository.findAll();
    }

    public Optional<Parent> getParentById(Long id) {
        return parentRepository.findById(id);
    }

    public List<Student> getChildrenByParentId(Long parentId) {
        return parentRepository.findById(parentId)
                .map(Parent::getChildren)
                .orElse(Collections.emptyList());
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
