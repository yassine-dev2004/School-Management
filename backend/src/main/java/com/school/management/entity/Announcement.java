package com.school.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "announcements")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Announcement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private String targetRole; // e.g., ALL, PARENT, STUDENT, TEACHER

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "class_id") // Nullable if school-wide
    @JsonIgnoreProperties({"students", "teacher", "hibernateLazyInitializer", "handler"})
    private SchoolClass targetClass;

    @Temporal(TemporalType.TIMESTAMP)
    private Date datePosted;

    public Announcement() {}

    public Announcement(Long id, String title, String content, String targetRole, SchoolClass targetClass, Date datePosted) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.targetRole = targetRole;
        this.targetClass = targetClass;
        this.datePosted = datePosted;
    }

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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public SchoolClass getTargetClass() {
        return targetClass;
    }

    public void setTargetClass(SchoolClass targetClass) {
        this.targetClass = targetClass;
    }

    public Date getDatePosted() {
        return datePosted;
    }

    public void setDatePosted(Date datePosted) {
        this.datePosted = datePosted;
    }
}
