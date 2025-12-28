package com.itmo.programmingclub.mapper;

import com.itmo.programmingclub.model.dto.ClassResponseDTO;
import com.itmo.programmingclub.model.entity.Class;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ClassMapper {

    private final TaskMapper taskMapper;

    public ClassResponseDTO toDto(Class classEntity) {
        if (classEntity == null) return null;

        return ClassResponseDTO.builder()
                .id(classEntity.getId())
                .scheduleId(classEntity.getSchedule() != null ? classEntity.getSchedule().getId() : null)
                .classDate(classEntity.getClassDate())
                .tasks(classEntity.getTasks() != null ?
                        classEntity.getTasks().stream().map(taskMapper::toDto).collect(Collectors.toList()) :
                        Collections.emptyList())
                .build();
    }
}