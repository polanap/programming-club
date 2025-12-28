package com.itmo.programmingclub.model.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ClassResponseDTO {
    private Integer id;
    private Integer scheduleId;
    private List<TaskResponseDTO> tasks;
}