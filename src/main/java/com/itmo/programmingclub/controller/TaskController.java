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

    // FR19: Curator can create tasks
    @PostMapping
    public ResponseEntity<TaskResponseDTO> createTask(@Valid @RequestBody TaskDTO taskDTO,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        Task createdTask = taskService.createTask(taskDTO, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(taskMapper.toDto(createdTask));
    }

    // FR20: Curator can edit their own tasks
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponseDTO> updateTask(@PathVariable Integer id,
                                                      @Valid @RequestBody TaskDTO taskDTO,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        Task updatedTask = taskService.updateTask(id, taskDTO, userDetails.getUsername());
        return ResponseEntity.ok(taskMapper.toDto(updatedTask));
    }

    // FR20: Curator can delete their own tasks
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Integer id,
                                           @AuthenticationPrincipal UserDetails userDetails) {
        taskService.deleteTask(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // Get tasks available for curator (their own tasks + open tasks)
    @GetMapping("/curator/available")
    public ResponseEntity<List<TaskResponseDTO>> getAvailableTasksForCurator(
            @AuthenticationPrincipal UserDetails userDetails) {
        // Get current user ID from CustomUserDetails
        com.itmo.programmingclub.security.CustomUserDetails customUserDetails = 
            (com.itmo.programmingclub.security.CustomUserDetails) userDetails;
        Integer curatorId = customUserDetails.getUserId();
        
        List<TaskResponseDTO> tasks = taskService.findAvailableTasksForCurator(curatorId).stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    // Get curator's own tasks
    @GetMapping("/curator/my")
    public ResponseEntity<List<TaskResponseDTO>> getMyTasks(
            @AuthenticationPrincipal UserDetails userDetails) {
        // Get current user ID from CustomUserDetails
        com.itmo.programmingclub.security.CustomUserDetails customUserDetails = 
            (com.itmo.programmingclub.security.CustomUserDetails) userDetails;
        Integer curatorId = customUserDetails.getUserId();
        
        List<TaskResponseDTO> tasks = taskService.findByAuthorId(curatorId).stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }
}

