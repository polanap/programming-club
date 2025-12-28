package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.model.dto.TeamChangeRequestDTO;
import com.itmo.programmingclub.model.entity.TeamChangeRequest;
import com.itmo.programmingclub.service.TeamChangeRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> createTeamChangeRequest(@Valid @RequestBody TeamChangeRequestDTO dto,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        teamChangeRequestService.createTeamChangeRequest(userDetails.getUsername(), dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{requestId}/process")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<Void> processTeamChangeRequest(@PathVariable Integer requestId,
                                                         @RequestParam boolean approved,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        teamChangeRequestService.processTeamChangeRequest(requestId, userDetails.getUsername(), approved);
        return ResponseEntity.ok().build();
    }
}

