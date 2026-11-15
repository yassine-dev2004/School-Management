package com.school.management.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "daily_lesson_logs", indexes = {
        @Index(name = "idx_lesson_class", columnList = "class_id"),
        @Index(name = "idx_lesson_date", columnList = "date"),
        @Index(name = "idx_lesson_subject", columnList = "subject_id")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DailyLessonLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "class_id", nullable = false)
    @JsonIgnoreProperties({"students", "hibernateLazyInitializer", "handler"})
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id", nullable = false)
    @JsonIgnoreProperties({"teachers", "hibernateLazyInitializer", "handler"})
    private Subject subject;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id")
    @JsonIgnoreProperties({"classes", "subjects", "hibernateLazyInitializer", "handler"})
    private Teacher teacher;

    @Temporal(TemporalType.DATE)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "Africa/Tunis")
    @Column(nullable = false)
    private Date date;

    @Column(nullable = false)
    private String title; // عنوان الدرس / النشاط

    @Column(columnDefinition = "TEXT")
    private String summary; // ما تم دراسته وتدريسه في الحصة بالتفصيل

    @Column(columnDefinition = "TEXT")
    private String homeworkAssigned; // الواجبات المنزلية والتمارين المقررة

    private String period; // الحصة والتوقيت (مثال: الحصة الأولى 08:30 - 10:00)

    public DailyLessonLog() {}

    public DailyLessonLog(Long id, SchoolClass schoolClass, Subject subject, Teacher teacher, Date date, String title, String summary, String homeworkAssigned, String period) {
        this.id = id;
        this.schoolClass = schoolClass;
        this.subject = subject;
        this.teacher = teacher;
        this.date = date;
        this.title = title;
        this.summary = summary;
        this.homeworkAssigned = homeworkAssigned;
        this.period = period;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getHomeworkAssigned() {
        return homeworkAssigned;
    }

    public void setHomeworkAssigned(String homeworkAssigned) {
        this.homeworkAssigned = homeworkAssigned;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }
}
