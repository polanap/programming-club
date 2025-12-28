package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.mapper.TestMapper;
import com.itmo.programmingclub.model.dto.TestDTO;
import com.itmo.programmingclub.model.dto.TestResponseDTO; // Импорт нового DTO
import com.itmo.programmingclub.model.entity.Test;
import com.itmo.programmingclub.service.TestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TestController {

    private final TestService testService;
    private final TestMapper testMapper;

    @PostMapping("/tasks/{taskId}/tests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TestResponseDTO> createTest(@PathVariable Integer taskId,
                                                      @Valid @RequestBody TestDTO testDTO,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        Test createdTest = testService.createTest(taskId, testDTO, userDetails.getUsername());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(testMapper.toResponseDto(createdTest));
    }

    @GetMapping("/tasks/{taskId}/tests")
    public ResponseEntity<List<TestResponseDTO>> getTestsByTask(@PathVariable Integer taskId) {
        List<Test> tests = testService.getTestsByTaskId(taskId);

        List<TestResponseDTO> dtos = tests.stream()
                .map(testMapper::toResponseDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/tests/{testId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TestResponseDTO> updateTest(@PathVariable Integer testId,
                                                      @Valid @RequestBody TestDTO testDTO,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        Test updatedTest = testService.updateTest(testId, testDTO, userDetails.getUsername());
        return ResponseEntity.ok(testMapper.toResponseDto(updatedTest));
    }

    @DeleteMapping("/tests/{testId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteTest(@PathVariable Integer testId,
                                           @AuthenticationPrincipal UserDetails userDetails) {
        testService.deleteTest(testId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}