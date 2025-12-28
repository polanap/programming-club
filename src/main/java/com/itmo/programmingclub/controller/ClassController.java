package com.itmo.programmingclub.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.itmo.programmingclub.mapper.ClassMapper;
import com.itmo.programmingclub.model.dto.ClassRequestDTO;
import com.itmo.programmingclub.model.dto.ClassResponseDTO;
import com.itmo.programmingclub.model.entity.Class;
import com.itmo.programmingclub.service.ClassService;
import com.itmo.programmingclub.service.TaskService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {
    private final ClassService classService;
    private final TaskService taskService;
    private final ClassMapper classMapper;

    @GetMapping
    public ResponseEntity<List<ClassResponseDTO>> getAllClasses() {
        List<ClassResponseDTO> dtos = classService.findAll().stream()
                .map(classMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassResponseDTO> getClassById(@PathVariable Integer id) {
        return classService.findByIdWithTasks(id)
                .map(classMapper::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<List<ClassResponseDTO>> getClassesBySchedule(@PathVariable Integer scheduleId) {
        List<ClassResponseDTO> dtos = classService.findByScheduleId(scheduleId).stream()
                .map(classMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ClassResponseDTO>> getClassesByGroup(@PathVariable Integer groupId) {
        List<ClassResponseDTO> dtos = classService.findByGroupId(groupId).stream()
                .map(classMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/curator/my")
    public ResponseEntity<List<ClassResponseDTO>> getMyClasses(@AuthenticationPrincipal UserDetails userDetails) {
        com.itmo.programmingclub.security.CustomUserDetails customUserDetails = 
            (com.itmo.programmingclub.security.CustomUserDetails) userDetails;
        Integer curatorId = customUserDetails.getUserId();
        System.err.println(curatorId);
        List<ClassResponseDTO> dtos = classService.findByCuratorId(curatorId).stream()
                .map(classMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<ClassResponseDTO> createClass(@Valid @RequestBody ClassRequestDTO dto) {
        Class created = classService.createClass(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(classMapper.toDto(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClassResponseDTO> updateClass(@PathVariable Integer id, @Valid @RequestBody ClassRequestDTO dto) {
        Class updated = classService.updateClass(id, dto);
        return ResponseEntity.ok(classMapper.toDto(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClass(@PathVariable Integer id) {
        if (classService.findById(id).isPresent()) {
            classService.deleteClass(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{classId}/tasks/{taskId}")
    public ResponseEntity<Void> assignTaskToClass(@PathVariable Integer classId,
                                                  @PathVariable Integer taskId,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        taskService.assignTaskToClass(classId, taskId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{classId}/tasks/{taskId}")
    public ResponseEntity<Void> removeTaskFromClass(@PathVariable Integer classId,
                                                    @PathVariable Integer taskId) {
        taskService.removeTaskFromClass(classId, taskId);
        return ResponseEntity.noContent().build();
    }
}