package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ElderChangeRequestDTO {
    @NotNull(message = "New Elder ID is required")
    private Integer newElderId;

    private String comment;
}