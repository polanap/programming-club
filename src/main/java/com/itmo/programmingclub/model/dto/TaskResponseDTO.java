package com.itmo.programmingclub.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TaskResponseDTO {
    private Integer id;
    private String condition;
    private Boolean isOpen;
    private AuthorDTO author;
}