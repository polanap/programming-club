package com.itmo.programmingclub.model.dto;

import com.itmo.programmingclub.model.entity.Task;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private Integer id;
    
    @NotBlank(message = "Condition cannot be empty")
    private String condition;

    private Boolean isOpen;

    public static TaskDTO fromEntity(Task task) {
        if (task == null) {
            return null;
        }
        
        return TaskDTO.builder()
                .id(task.getId())
                .condition(task.getCondition())
                .isOpen(task.getIsOpen())
                .build();
    }
}
