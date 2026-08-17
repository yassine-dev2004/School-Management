package com.school.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "homework")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Homework {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    
    @Temporal(TemporalType.DATE)
    private Date dueDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "class_id")
    @JsonIgnoreProperties({"students", "teacher", "hibernateLazyInitializer", "handler"})
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Subject subject;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id")
    @JsonIgnoreProperties({"classes", "subjects", "hibernateLazyInitializer", "handler"})
    private Teacher teacher;

    @OneToMany(mappedBy = "homework", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"homework", "hibernateLazyInitializer", "handler"})
    private List<HomeworkSubmission> submissions;

    public Homework() {}

    public Homework(Long id, String title, String description, Date dueDate, SchoolClass schoolClass, Subject subject, Teacher teacher, List<HomeworkSubmission> submissions) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.schoolClass = schoolClass;
        this.subject = subject;
        this.teacher = teacher;
        this.submissions = submissions;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Date getDueDate() {
        return dueDate;
    }

    public void setDueDate(Date dueDate) {
        this.dueDate = dueDate;
    }

    public SchoolClass getSchoolClass() {
        return schoolClass;
    }

    public void setSchoolClass(SchoolClass schoolClass) {
        this.schoolClass = schoolClass;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public Teacher getTeacher() {
        return teacher;
    }

    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public List<HomeworkSubmission> getSubmissions() {
        return submissions;
    }

    public void setSubmissions(List<HomeworkSubmission> submissions) {
        this.submissions = submissions;
    }
}
