package com.school.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "school_classes")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SchoolClass {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String section;

    private Double annualFee = 1200.0;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id")
    @JsonIgnoreProperties({"classes", "subjects", "hibernateLazyInitializer", "handler"})
    private Teacher teacher; // Homeroom / Lead teacher

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "class_teachers",
            joinColumns = @JoinColumn(name = "class_id"),
            inverseJoinColumns = @JoinColumn(name = "teacher_id"))
    @JsonIgnoreProperties({"classes", "subjects", "hibernateLazyInitializer", "handler"})
    private java.util.Set<Teacher> teachers = new java.util.HashSet<>();

    @OneToMany(mappedBy = "schoolClass", fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"schoolClass", "parent", "hibernateLazyInitializer", "handler"})
    private List<Student> students;

    public SchoolClass() {}

    public SchoolClass(Long id, String name, String section, Teacher teacher, List<Student> students) {
        this.id = id;
        this.name = name;
        this.section = section;
        this.teacher = teacher;
        this.students = students;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public Double getAnnualFee() {
        return annualFee != null ? annualFee : 1200.0;
    }

    public void setAnnualFee(Double annualFee) {
        this.annualFee = annualFee;
    }

    public Teacher getTeacher() {
        return teacher;
    }

    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public java.util.Set<Teacher> getTeachers() {
        return teachers;
    }

    public void setTeachers(java.util.Set<Teacher> teachers) {
        this.teachers = teachers != null ? teachers : new java.util.HashSet<>();
    }

    public List<Student> getStudents() {
        return students;
    }

    public void setStudents(List<Student> students) {
        this.students = students;
    }
}
