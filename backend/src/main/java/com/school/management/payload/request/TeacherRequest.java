package com.school.management.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TeacherRequest {
    // User fields
    @NotBlank(message = "Username is required")
    private String username;

    private String email;

    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    // Teacher fields
    private String qualification;
    private String joiningDate;
}
