package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassRequestDTO {
    @NotNull(message = "Schedule ID is required")
    private Integer scheduleId;
    
    private LocalDate classDate; // Optional - defaults to today if not provided
}