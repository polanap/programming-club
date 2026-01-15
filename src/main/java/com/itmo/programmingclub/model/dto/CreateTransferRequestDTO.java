package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTransferRequestDTO {
    @NotBlank(message = "Reason cannot be empty")
    private String reason;

    @NotNull(message = "Source group ID is required")
    private Integer sourceGroupId;
}
