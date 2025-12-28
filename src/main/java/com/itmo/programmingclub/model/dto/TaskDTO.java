package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    @NotBlank(message = "Condition cannot be empty")
    private String condition;

    private Boolean isOpen;
}
