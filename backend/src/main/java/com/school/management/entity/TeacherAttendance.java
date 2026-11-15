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

    private Double hoursCount = 1.0; // عدد ساعات التدريس
    private String startTime; // وقت البداية
    private String endTime;   // وقت النهاية
    private Double hourlyRate = 25.0; // الأجر بالساعة بالدينار التونسي

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id")
    @JsonIgnoreProperties({"teachers", "hibernateLazyInitializer", "handler"})
    private Subject subject;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "class_id")
    @JsonIgnoreProperties({"teacher", "teachers", "students", "hibernateLazyInitializer", "handler"})
    private SchoolClass schoolClass;

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

    public Double getHoursCount() {
        return hoursCount != null ? hoursCount : 1.0;
    }

    public void setHoursCount(Double hoursCount) {
        this.hoursCount = hoursCount;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public Double getHourlyRate() {
        return hourlyRate != null ? hourlyRate : 25.0;
    }

    public void setHourlyRate(Double hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public SchoolClass getSchoolClass() {
        return schoolClass;
    }

    public void setSchoolClass(SchoolClass schoolClass) {
        this.schoolClass = schoolClass;
    }
}
