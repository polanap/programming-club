package com.itmo.programmingclub.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponseDTO {
    private Integer id;
    private String condition;
    private Boolean isOpen;
    private AuthorDTO author;
}