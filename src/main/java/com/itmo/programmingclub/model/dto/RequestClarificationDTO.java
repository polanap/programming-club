package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestClarificationDTO {
    @NotNull(message = "Curator ID is required")
    private Integer curatorId;
}
