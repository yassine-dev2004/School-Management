package com.school.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "homework_submissions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class HomeworkSubmission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "homework_id", nullable = false)
    @JsonIgnoreProperties({"submissions", "hibernateLazyInitializer", "handler"})
    private Homework homework;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"parent", "schoolClass", "hibernateLazyInitializer", "handler"})
    private Student student;

    private String status; // Pending, Submitted, Graded
    private String attachmentUrl;

    @Temporal(TemporalType.TIMESTAMP)
    private Date submissionDate;

    public HomeworkSubmission() {}

    public HomeworkSubmission(Long id, Homework homework, Student student, String status, String attachmentUrl, Date submissionDate) {
        this.id = id;
        this.homework = homework;
        this.student = student;
        this.status = status;
        this.attachmentUrl = attachmentUrl;
        this.submissionDate = submissionDate;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Homework getHomework() {
        return homework;
    }

    public void setHomework(Homework homework) {
        this.homework = homework;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public Date getSubmissionDate() {
        return submissionDate;
    }

    public void setSubmissionDate(Date submissionDate) {
        this.submissionDate = submissionDate;
    }
}
