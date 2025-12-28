package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.model.entity.Class;
import com.itmo.programmingclub.service.ClassService;
import com.itmo.programmingclub.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {
    private final ClassService classService;
    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<Class>> getAllClasses() {
        return ResponseEntity.ok(classService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Class> getClassById(@PathVariable Integer id) {
        return classService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<List<Class>> getClassesBySchedule(@PathVariable Integer scheduleId) {
        return ResponseEntity.ok(classService.findByScheduleId(scheduleId));
    }

    @PostMapping
    public ResponseEntity<Class> createClass(@RequestBody Class classEntity) {
        Class created = classService.createClass(classEntity);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Class> updateClass(@PathVariable Integer id, @RequestBody Class classEntity) {
        return classService.findById(id)
                .map(existing -> {
                    classEntity.setId(id);
                    return ResponseEntity.ok(classService.updateClass(classEntity));
                })
                .orElse(ResponseEntity.notFound().build());
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
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<Void> assignTaskToClass(@PathVariable Integer classId,
                                                  @PathVariable Integer taskId,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        taskService.assignTaskToClass(classId, taskId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{classId}/tasks/{taskId}")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<Void> removeTaskFromClass(@PathVariable Integer classId,
                                                    @PathVariable Integer taskId) {
        taskService.removeTaskFromClass(classId, taskId);
        return ResponseEntity.noContent().build();
    }
}

