package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ClassRequestDTO {
    @NotNull(message = "Schedule ID is required")
    private Integer scheduleId;
}