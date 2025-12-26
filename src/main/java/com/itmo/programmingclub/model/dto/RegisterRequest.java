package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import com.itmo.programmingclub.model.RoleEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "Username cannot be empty")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username must not contain spaces or special characters")
    private String username;

    @NotBlank(message = "Password cannot be empty")
    @Pattern(regexp = "^\\S+$", message = "Password must not contain whitespace")
    private String password;

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Bad email format")
    private String email;

    @NotBlank(message = "Full name cannot be empty")
    @Pattern(regexp = "^[a-zA-Zа-яА-ЯёЁ\\s'-]+$", message = "Full name can only contain letters, spaces, hyphens and apostrophes")
    private String fullName;

    private RoleEnum role;
}

