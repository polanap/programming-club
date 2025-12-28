package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TeamChangeRequestDTO {
    @NotNull(message = "Target team ID is required")
    private Integer toTeamId;

    private String comment;
}