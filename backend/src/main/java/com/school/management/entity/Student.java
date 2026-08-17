package com.school.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "students")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Student {
    
    @Id
    private Long id; // Matches user_id

    @OneToOne(fetch = FetchType.EAGER)
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "parent_id")
    @JsonIgnoreProperties({"children", "hibernateLazyInitializer", "handler"})
    private Parent parent;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "class_id")
    @JsonIgnoreProperties({"students", "teacher", "hibernateLazyInitializer", "handler"})
    private SchoolClass schoolClass;

    private String emergencyContact;
    private String status;
    private Date enrollmentDate;

    public Student() {}

    public Student(Long id, User user, Parent parent, SchoolClass schoolClass, String emergencyContact, String status, Date enrollmentDate) {
        this.id = id;
        this.user = user;
        this.parent = parent;
        this.schoolClass = schoolClass;
        this.emergencyContact = emergencyContact;
        this.status = status;
        this.enrollmentDate = enrollmentDate;
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

    public Parent getParent() {
        return parent;
    }

    public void setParent(Parent parent) {
        this.parent = parent;
    }

    public SchoolClass getSchoolClass() {
        return schoolClass;
    }

    public void setSchoolClass(SchoolClass schoolClass) {
        this.schoolClass = schoolClass;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getEnrollmentDate() {
        return enrollmentDate;
    }

    public void setEnrollmentDate(Date enrollmentDate) {
        this.enrollmentDate = enrollmentDate;
    }
}
