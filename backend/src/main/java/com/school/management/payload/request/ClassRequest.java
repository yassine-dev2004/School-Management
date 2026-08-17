package com.school.management.payload.request;

import jakarta.validation.constraints.NotBlank;

public class ClassRequest {
    @NotBlank(message = "Class name is required")
    private String name;

    private String section;
    private Long teacherId;

    public ClassRequest() {}

    public ClassRequest(String name, String section, Long teacherId) {
        this.name = name;
        this.section = section;
        this.teacherId = teacherId;
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
}
