package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.mapper.TaskMapper;
import com.itmo.programmingclub.model.dto.TaskDTO;
import com.itmo.programmingclub.model.dto.TaskResponseDTO;
import com.itmo.programmingclub.model.entity.Task;
import com.itmo.programmingclub.service.TaskService;
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
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {
    private final TaskService taskService;
    private final TaskMapper taskMapper;

    @GetMapping
    public ResponseEntity<List<TaskResponseDTO>> getAllTasks() {
        List<TaskResponseDTO> tasks = taskService.findAll().stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponseDTO> getTaskById(@PathVariable Integer id) {
        return taskService.findById(id)
                .map(taskMapper::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<TaskResponseDTO>> getTasksByAuthor(@PathVariable Integer authorId) {
        List<TaskResponseDTO> tasks = taskService.findByAuthorId(authorId).stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/open")
    public ResponseEntity<List<TaskResponseDTO>> getOpenTasks() {
        List<TaskResponseDTO> tasks = taskService.findOpenTasks().stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @PostMapping
    public ResponseEntity<TaskResponseDTO> createTask(@Valid @RequestBody TaskDTO taskDTO,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        Task createdTask = taskService.createTask(taskDTO, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(taskMapper.toDto(createdTask));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponseDTO> updateTask(@PathVariable Integer id,
                                                      @Valid @RequestBody TaskDTO taskDTO,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        Task updatedTask = taskService.updateTask(id, taskDTO, userDetails.getUsername());
        return ResponseEntity.ok(taskMapper.toDto(updatedTask));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Integer id,
                                           @AuthenticationPrincipal UserDetails userDetails) {
        taskService.deleteTask(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}

