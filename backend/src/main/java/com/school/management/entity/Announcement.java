package com.school.management.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "announcements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Announcement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private String targetRole; // e.g., ALL, PARENT, STUDENT, TEACHER

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id") // Nullable if school-wide
    private SchoolClass targetClass;

    @Temporal(TemporalType.TIMESTAMP)
    private Date datePosted;
}
