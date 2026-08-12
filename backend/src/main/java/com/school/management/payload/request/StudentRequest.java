package com.school.management.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class StudentRequest {
    // User fields
    @NotBlank(message = "Username is required")
    private String username;

    private String email;

    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    // Student fields
    private String emergencyContact;
    private String status;
    private Long parentId;
    private Long classId;
}
