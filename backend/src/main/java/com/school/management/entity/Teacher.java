package com.school.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "teachers")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Teacher {
    
    @Id
    private Long id; // Matches user_id

    @OneToOne(fetch = FetchType.EAGER)
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    private String qualification;
    private String joiningDate;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "teacher_subjects",
            joinColumns = @JoinColumn(name = "teacher_id"),
            inverseJoinColumns = @JoinColumn(name = "subject_id"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Set<Subject> subjects = new HashSet<>();

    @OneToMany(mappedBy = "teacher")
    @JsonIgnoreProperties({"teacher", "students", "hibernateLazyInitializer", "handler"})
    private List<SchoolClass> classes;

    public Teacher() {}

    public Teacher(Long id, User user, String qualification, String joiningDate, Set<Subject> subjects, List<SchoolClass> classes) {
        this.id = id;
        this.user = user;
        this.qualification = qualification;
        this.joiningDate = joiningDate;
        this.subjects = subjects != null ? subjects : new HashSet<>();
        this.classes = classes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getQualification() {
        return qualification;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public String getJoiningDate() {
        return joiningDate;
    }

    public void setJoiningDate(String joiningDate) {
        this.joiningDate = joiningDate;
    }

    public Set<Subject> getSubjects() {
        return subjects;
    }

    public void setSubjects(Set<Subject> subjects) {
        this.subjects = subjects;
    }

    public List<SchoolClass> getClasses() {
        return classes;
    }

    public void setClasses(List<SchoolClass> classes) {
        this.classes = classes;
    }
}
