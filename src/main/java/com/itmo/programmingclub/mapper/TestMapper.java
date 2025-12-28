package com.itmo.programmingclub.mapper;

import com.itmo.programmingclub.model.dto.TestDTO;
import com.itmo.programmingclub.model.dto.TestResponseDTO;
import com.itmo.programmingclub.model.entity.Test;
import org.springframework.stereotype.Component;

@Component
public class TestMapper {

    public TestResponseDTO toResponseDto(Test test) {
        if (test == null) return null;

        return TestResponseDTO.builder()
                .id(test.getId())
                .input(test.getInput())
                .output(test.getOutput())
                .taskId(test.getTask() != null ? test.getTask().getId() : null)
                .build();
    }

    public Test toEntity(TestDTO dto) {
        if (dto == null) return null;

        Test test = new Test();
        test.setInput(dto.getInput());
        test.setOutput(dto.getOutput());
        return test;
    }
}