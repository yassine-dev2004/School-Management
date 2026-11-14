package com.school.management.payload.request;

import jakarta.validation.constraints.NotBlank;
import java.util.Set;

public class ClassRequest {
    @NotBlank(message = "Class name is required")
    private String name;

    private String section;
    private Long teacherId;
    private Set<Long> teacherIds;

    public ClassRequest() {}

    public ClassRequest(String name, String section, Long teacherId) {
        this.name = name;
        this.section = section;
        this.teacherId = teacherId;
    }

    public ClassRequest(String name, String section, Long teacherId, Set<Long> teacherIds) {
        this.name = name;
        this.section = section;
        this.teacherId = teacherId;
        this.teacherIds = teacherIds;
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

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public Set<Long> getTeacherIds() {
        return teacherIds;
    }

    public void setTeacherIds(Set<Long> teacherIds) {
        this.teacherIds = teacherIds;
    }
}
