package com.school.management.controller;

import jakarta.validation.Valid;
import com.school.management.entity.Parent;
import com.school.management.entity.Student;
import com.school.management.service.ParentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/parents")
public class ParentController {

    @Autowired
    private ParentService parentService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public List<Parent> getAllParents() {
        return parentService.getAllParents();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('PARENT')")
    public ResponseEntity<Parent> getParentById(@PathVariable Long id) {
        return parentService.getParentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/children")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('PARENT')")
    public List<Student> getChildren(@PathVariable Long id) {
        return parentService.getChildrenByParentId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public Parent createParent(@Valid @RequestBody com.school.management.payload.request.ParentRequest request) {
        return parentService.createParent(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<Parent> updateParent(@PathVariable Long id, @Valid @RequestBody com.school.management.payload.request.ParentRequest request) {
        try {
            return ResponseEntity.ok(parentService.updateParent(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> deleteParent(@PathVariable Long id) {
        return parentService.getParentById(id)
                .map(parent -> {
                    parentService.deleteParent(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
