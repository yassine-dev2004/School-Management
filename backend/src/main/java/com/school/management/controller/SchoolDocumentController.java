package com.school.management.controller;

import com.school.management.entity.SchoolDocument;
import com.school.management.service.SchoolDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLConnection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SchoolDocumentController {

    @Autowired
    private SchoolDocumentService documentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "purpose", required = false) String purpose,
            @RequestParam(value = "classId", required = false) Long classId,
            @RequestParam(value = "studentId", required = false) Long studentId,
            @RequestParam(value = "notes", required = false) String notes,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            SchoolDocument saved = documentService.storeDocument(file, title, purpose, classId, studentId, notes, username);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (IOException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "فشل حفظ الملف على الخادم: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<List<SchoolDocument>> getAllDocuments() {
        return ResponseEntity.ok(documentService.getAllDocuments());
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<List<SchoolDocument>> getMyDocuments(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(documentService.getDocumentsBySubmitter(username));
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<List<SchoolDocument>> getDocumentsByClass(@PathVariable Long classId) {
        return ResponseEntity.ok(documentService.getDocumentsByClass(classId));
    }

    @GetMapping("/view/{fileName:.+}")
    public ResponseEntity<Resource> viewDocument(@PathVariable String fileName) {
        try {
            Resource resource = documentService.loadFileAsResource(fileName);
            String contentType = null;
            try {
                contentType = URLConnection.guessContentTypeFromName(resource.getFilename());
            } catch (Exception ignored) {}
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable String fileName) {
        try {
            Resource resource = documentService.loadFileAsResource(fileName);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        boolean deleted = documentService.deleteDocument(id);
        if (deleted) {
            Map<String, String> res = new HashMap<>();
            res.put("message", "تم حذف الوثيقة بنجاح");
            return ResponseEntity.ok(res);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
