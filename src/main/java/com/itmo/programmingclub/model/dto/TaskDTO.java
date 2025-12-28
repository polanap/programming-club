package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TaskDTO {
    @NotBlank(message = "Condition cannot be empty")
    private String condition;

    private Boolean isOpen;
}
