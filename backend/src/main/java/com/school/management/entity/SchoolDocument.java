package com.school.management.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "school_documents", indexes = {
        @Index(name = "idx_doc_submitter", columnList = "submitted_by"),
        @Index(name = "idx_doc_class", columnList = "class_id"),
        @Index(name = "idx_doc_purpose", columnList = "purpose")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SchoolDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title; // عنوان الوثيقة / المستند

    @Column(nullable = false)
    private String purpose; // الغرض: فرض / امتحان، مذكرة درس، صورة ورقة، شهادة طبية، وثيقة إدارية، أخرى

    @Column(nullable = false)
    private String fileName; // اسم الملف المحفوظ على الخادم

    private String originalFileName; // اسم الملف الأصلي

    private String fileType; // نوع الملف (application/pdf, image/jpeg, etc.)

    private Long fileSize; // حجم الملف بالبايت

    private String fileUrl; // رابط العرض أو التحميل

    @Column(name = "submitted_by", nullable = false)
    private String submittedBy; // اسم المستخدم الذي أرسل الملف

    private String submittedByName; // الاسم الكامل للأستاذ أو المسؤول

    private String submitterRole = "TEACHER"; // TEACHER أو ADMINISTRATOR

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "class_id")
    @JsonIgnoreProperties({"students", "teacher", "teachers", "hibernateLazyInitializer", "handler"})
    private SchoolClass schoolClass; // الفصل المرتبط (اختياري)

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id")
    @JsonIgnoreProperties({"parent", "schoolClass", "hibernateLazyInitializer", "handler"})
    private Student student; // الطالب المرتبط (اختياري)

    @Temporal(TemporalType.TIMESTAMP)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Africa/Tunis")
    @Column(nullable = false)
    private Date submissionDate; // تاريخ ووقت التقديم

    @Column(columnDefinition = "TEXT")
    private String notes; // تفاصيل أو ملاحظات إضافية

    public SchoolDocument() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getSubmittedBy() {
        return submittedBy;
    }

    public void setSubmittedBy(String submittedBy) {
        this.submittedBy = submittedBy;
    }

    public String getSubmittedByName() {
        return submittedByName;
    }

    public void setSubmittedByName(String submittedByName) {
        this.submittedByName = submittedByName;
    }

    public String getSubmitterRole() {
        return submitterRole;
    }

    public void setSubmitterRole(String submitterRole) {
        this.submitterRole = submitterRole;
    }

    public SchoolClass getSchoolClass() {
        return schoolClass;
    }

    public void setSchoolClass(SchoolClass schoolClass) {
        this.schoolClass = schoolClass;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Date getSubmissionDate() {
        return submissionDate;
    }

    public void setSubmissionDate(Date submissionDate) {
        this.submissionDate = submissionDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
