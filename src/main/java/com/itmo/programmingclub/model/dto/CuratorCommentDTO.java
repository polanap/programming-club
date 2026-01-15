package com.itmo.programmingclub.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CuratorCommentDTO {
    @NotBlank(message = "Comment cannot be empty")
    private String comment;
}
