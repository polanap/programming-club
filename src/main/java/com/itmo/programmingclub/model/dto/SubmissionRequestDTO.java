package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmissionRequestDTO {
    @NotBlank(message = "Code cannot be empty")
    private String code;

    @NotBlank(message = "Language cannot be empty")
    private String language;
}