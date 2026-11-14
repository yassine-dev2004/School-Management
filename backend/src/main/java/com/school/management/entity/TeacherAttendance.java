package com.school.management.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "teacher_attendance", indexes = {
        @Index(name = "idx_teacher_att_teacher", columnList = "teacher_id"),
        @Index(name = "idx_teacher_att_date", columnList = "date")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TeacherAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    @JsonIgnoreProperties({"classes", "subjects", "hibernateLazyInitializer", "handler"})
    private Teacher teacher;

    @Temporal(TemporalType.DATE)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "Africa/Tunis")
    private Date date;

    @Column(nullable = false)
    private String status; // حاضر, غائب, متأخر

    private String checkInTime; // e.g. 08:30:15
    private String remarks; // ملاحظات

    public TeacherAttendance() {}

    public TeacherAttendance(Long id, Teacher teacher, Date date, String status, String checkInTime, String remarks) {
        this.id = id;
        this.teacher = teacher;
        this.date = date;
        this.status = status;
        this.checkInTime = checkInTime;
        this.remarks = remarks;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Teacher getTeacher() {
        return teacher;
    }

    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCheckInTime() {
        return checkInTime;
    }

    public void setCheckInTime(String checkInTime) {
        this.checkInTime = checkInTime;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
