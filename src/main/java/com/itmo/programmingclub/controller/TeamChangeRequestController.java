package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.model.entity.TeamChangeRequest;
import com.itmo.programmingclub.service.TeamChangeRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/team-change-requests")
@RequiredArgsConstructor
public class TeamChangeRequestController {
    private final TeamChangeRequestService teamChangeRequestService;

    @GetMapping
    public ResponseEntity<List<TeamChangeRequest>> getAllTeamChangeRequests() {
        return ResponseEntity.ok(teamChangeRequestService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamChangeRequest> getTeamChangeRequestById(@PathVariable Integer id) {
        return teamChangeRequestService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<TeamChangeRequest>> getTeamChangeRequestsByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(teamChangeRequestService.findByStudentId(studentId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TeamChangeRequest>> getTeamChangeRequestsByStatus(@PathVariable String status) {
        try {
            TeamChangeRequest.RequestStatus statusEnum = TeamChangeRequest.RequestStatus.valueOf(status);
            return ResponseEntity.ok(teamChangeRequestService.findByStatus(statusEnum));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<TeamChangeRequest> createTeamChangeRequest(@RequestBody TeamChangeRequest request) {
        TeamChangeRequest created = teamChangeRequestService.createTeamChangeRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamChangeRequest> updateTeamChangeRequest(@PathVariable Integer id, @RequestBody TeamChangeRequest request) {
        return teamChangeRequestService.findById(id)
                .map(existing -> {
                    request.setId(id);
                    return ResponseEntity.ok(teamChangeRequestService.updateTeamChangeRequest(request));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

