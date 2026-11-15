package com.school.management.service;

import com.school.management.entity.SchoolClass;
import com.school.management.entity.SchoolDocument;
import com.school.management.entity.Student;
import com.school.management.entity.User;
import com.school.management.repository.SchoolClassRepository;
import com.school.management.repository.SchoolDocumentRepository;
import com.school.management.repository.StudentRepository;
import com.school.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SchoolDocumentService {

    private final Path uploadDir = Paths.get("uploads", "documents").toAbsolutePath().normalize();

    @Autowired
    private SchoolDocumentRepository schoolDocumentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SchoolClassRepository schoolClassRepository;

    @Autowired
    private StudentRepository studentRepository;

    public SchoolDocumentService() {
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            System.err.println("Could not create documents upload directory: " + e.getMessage());
        }
    }

    public SchoolDocument storeDocument(MultipartFile file,
                                         String title,
                                         String purpose,
                                         Long classId,
                                         Long studentId,
                                         String notes,
                                         String username) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("الملف المرفق فارغ");
        }

        Files.createDirectories(uploadDir);

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "document_" + System.currentTimeMillis();
        }

        // Clean file name
        String cleanOriginal = Paths.get(originalFilename).getFileName().toString();
        String extension = "";
        int dotIndex = cleanOriginal.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = cleanOriginal.substring(dotIndex);
        }

        String storedFileName = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + extension;
        Path targetLocation = this.uploadDir.resolve(storedFileName);

        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        SchoolDocument doc = new SchoolDocument();
        doc.setTitle((title != null && !title.isBlank()) ? title.trim() : cleanOriginal);
        doc.setPurpose((purpose != null && !purpose.isBlank()) ? purpose.trim() : "عام");
        doc.setFileName(storedFileName);
        doc.setOriginalFileName(cleanOriginal);
        doc.setFileType(file.getContentType());
        doc.setFileSize(file.getSize());
        doc.setFileUrl("/api/documents/view/" + storedFileName);
        doc.setSubmittedBy(username);
        doc.setSubmissionDate(new Date());
        doc.setNotes(notes);

        if (username != null) {
            Optional<User> uOpt = userRepository.findByUsername(username);
            if (uOpt.isPresent()) {
                User u = uOpt.get();
                String fullName = (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "");
                doc.setSubmittedByName(!fullName.trim().isEmpty() ? fullName.trim() : username);
                boolean isProf = u.getRoles().stream().anyMatch(r -> r.getName().name().contains("TEACHER"));
                doc.setSubmitterRole(isProf ? "TEACHER" : "ADMINISTRATOR");
            } else {
                doc.setSubmittedByName(username);
            }
        }

        if (classId != null) {
            schoolClassRepository.findById(classId).ifPresent(doc::setSchoolClass);
        }
        if (studentId != null) {
            studentRepository.findById(studentId).ifPresent(doc::setStudent);
        }

        return schoolDocumentRepository.save(doc);
    }

    public List<SchoolDocument> getAllDocuments() {
        return schoolDocumentRepository.findAllByOrderBySubmissionDateDesc();
    }

    public List<SchoolDocument> getDocumentsBySubmitter(String username) {
        return schoolDocumentRepository.findBySubmittedByOrderBySubmissionDateDesc(username);
    }

    public List<SchoolDocument> getDocumentsByClass(Long classId) {
        return schoolDocumentRepository.findBySchoolClassIdOrderBySubmissionDateDesc(classId);
    }

    public Optional<SchoolDocument> getDocumentById(Long id) {
        return schoolDocumentRepository.findById(id);
    }

    public Resource loadFileAsResource(String fileName) throws MalformedURLException {
        Path filePath = this.uploadDir.resolve(fileName).normalize();
        Resource resource = new UrlResource(filePath.toUri());
        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("File not found or unreadable: " + fileName);
        }
    }

    public boolean deleteDocument(Long id) {
        Optional<SchoolDocument> docOpt = schoolDocumentRepository.findById(id);
        if (docOpt.isPresent()) {
            SchoolDocument doc = docOpt.get();
            try {
                Path filePath = this.uploadDir.resolve(doc.getFileName()).normalize();
                Files.deleteIfExists(filePath);
            } catch (Exception ignored) {}
            schoolDocumentRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
