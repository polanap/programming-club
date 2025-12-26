package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.entity.Schedule;
import com.itmo.programmingclub.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {
    private final ScheduleService scheduleService;

    @GetMapping
    public ResponseEntity<List<Schedule>> getAllSchedules() {
        return ResponseEntity.ok(scheduleService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Schedule> getScheduleById(@PathVariable Integer id) {
        return scheduleService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Schedule>> getSchedulesByGroup(@PathVariable Integer groupId) {
        return ResponseEntity.ok(scheduleService.findByGroupId(groupId));
    }

    @GetMapping("/group/{groupId}/relevant")
    public ResponseEntity<List<Schedule>> getRelevantSchedulesByGroup(@PathVariable Integer groupId) {
        return ResponseEntity.ok(scheduleService.findRelevantByGroupId(groupId));
    }

    @PostMapping
    public ResponseEntity<Schedule> createSchedule(@RequestBody Schedule schedule) {
        Schedule created = scheduleService.createSchedule(schedule);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Schedule> updateSchedule(@PathVariable Integer id, @RequestBody Schedule schedule) {
        return scheduleService.findById(id)
                .map(existing -> {
                    schedule.setId(id);
                    return ResponseEntity.ok(scheduleService.updateSchedule(schedule));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Integer id) {
        if (scheduleService.findById(id).isPresent()) {
            scheduleService.deleteSchedule(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

