package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddAvailableGroupsDTO {
    @NotNull(message = "Request ID is required")
    private Integer requestId;

    @NotEmpty(message = "At least one group ID is required")
    private List<Integer> groupIds;
}
