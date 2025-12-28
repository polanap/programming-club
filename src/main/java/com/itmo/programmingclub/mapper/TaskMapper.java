package com.itmo.programmingclub.mapper;

import com.itmo.programmingclub.model.dto.AuthorDTO;
import com.itmo.programmingclub.model.dto.TaskResponseDTO;
import com.itmo.programmingclub.model.entity.Task;
import com.itmo.programmingclub.model.entity.User;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {

    public TaskResponseDTO toDto(Task task) {
        if (task == null) return null;

        return TaskResponseDTO.builder()
                .id(task.getId())
                .condition(task.getCondition())
                .isOpen(task.getIsOpen())
                .author(toAuthorDto(task.getAuthor()))
                .build();
    }

    private AuthorDTO toAuthorDto(User user) {
        if (user == null) return null;

        return AuthorDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .build();
    }
}