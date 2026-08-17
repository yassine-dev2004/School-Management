package com.school.management.payload.request;

import jakarta.validation.constraints.NotBlank;
import java.util.Date;

public class HomeworkRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private Date dueDate;
    private Long classId;
    private Long subjectId;
    private Long teacherId;

    public HomeworkRequest() {}

    public HomeworkRequest(String title, String description, Date dueDate, Long classId, Long subjectId, Long teacherId) {
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.classId = classId;
        this.subjectId = subjectId;
        this.teacherId = teacherId;
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

    public Long getClassId() {
        return classId;
    }

    public void setClassId(Long classId) {
        this.classId = classId;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }
}
