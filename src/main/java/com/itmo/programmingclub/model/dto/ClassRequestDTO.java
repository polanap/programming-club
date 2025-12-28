package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassRequestDTO {
    @NotNull(message = "Schedule ID is required")
    private Integer scheduleId;
}