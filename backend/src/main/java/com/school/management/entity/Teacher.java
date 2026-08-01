package com.school.management.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "teachers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Teacher {
    
    @Id
    private Long id; // Matches user_id

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    private String qualification;
    private String joiningDate;

    @ManyToMany
    @JoinTable(name = "teacher_subjects",
            joinColumns = @JoinColumn(name = "teacher_id"),
            inverseJoinColumns = @JoinColumn(name = "subject_id"))
    private Set<Subject> subjects;

    @OneToMany(mappedBy = "teacher", cascade = CascadeType.ALL)
    private List<SchoolClass> classes;
}
