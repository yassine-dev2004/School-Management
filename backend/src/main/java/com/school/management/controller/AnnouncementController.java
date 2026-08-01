package com.school.management.controller;

import jakarta.validation.Valid;
import com.school.management.entity.Announcement;
import com.school.management.service.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    @GetMapping
    public List<Announcement> getAllAnnouncements() {
        return announcementService.getAllAnnouncements();
    }

    @GetMapping("/role/{role}")
    public List<Announcement> getAnnouncementsByRole(@PathVariable String role) {
        return announcementService.getAnnouncementsByTargetRole(role);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public Announcement createAnnouncement(@Valid @RequestBody Announcement announcement) {
        announcement.setDatePosted(new Date());
        return announcementService.saveAnnouncement(announcement);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<Announcement> updateAnnouncement(@PathVariable Long id, @Valid @RequestBody Announcement announcementDetails) {
        return announcementService.getAnnouncementById(id)
                .map(announcement -> {
                    announcement.setTitle(announcementDetails.getTitle());
                    announcement.setContent(announcementDetails.getContent());
                    announcement.setTargetRole(announcementDetails.getTargetRole());
                    announcement.setTargetClass(announcementDetails.getTargetClass());
                    return ResponseEntity.ok(announcementService.saveAnnouncement(announcement));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        return announcementService.getAnnouncementById(id)
                .map(announcement -> {
                    announcementService.deleteAnnouncement(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
