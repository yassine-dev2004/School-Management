package com.school.management.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "homework_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HomeworkSubmission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homework_id", nullable = false)
    private Homework homework;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    private String status; // Pending, Submitted, Graded
    private String attachmentUrl;

    @Temporal(TemporalType.TIMESTAMP)
    private Date submissionDate;
}
