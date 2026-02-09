package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.model.dto.EventDTO;
import com.itmo.programmingclub.model.entity.Event;
import com.itmo.programmingclub.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(eventService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Integer id) {
        return eventService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('CURATOR', 'MANAGER')")
    public ResponseEntity<List<EventDTO>> getEventsByClass(@PathVariable Integer classId) {
        return ResponseEntity.ok(eventService.findDTOsByClassId(classId));
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<Event>> getEventsByTeam(@PathVariable Integer teamId) {
        return ResponseEntity.ok(eventService.findByTeamId(teamId));
    }

    @GetMapping("/time-range")
    public ResponseEntity<List<Event>> getEventsByTimeRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endTime) {
        return ResponseEntity.ok(eventService.findByTimeRange(startTime, endTime));
    }

    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        Event created = eventService.createEvent(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}

