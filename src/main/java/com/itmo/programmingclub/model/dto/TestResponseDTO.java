package com.itmo.programmingclub.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestResponseDTO {
    private Integer id;
    private String input;
    private String output;
    private Integer taskId;
}