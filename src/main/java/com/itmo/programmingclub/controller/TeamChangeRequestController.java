package com.itmo.programmingclub.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.itmo.programmingclub.model.dto.TeamChangeRequestDTO;
import com.itmo.programmingclub.model.dto.TeamChangeRequestResponseDTO;
import com.itmo.programmingclub.service.TeamChangeRequestService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/team-change-requests")
@RequiredArgsConstructor
public class TeamChangeRequestController {
    private final TeamChangeRequestService teamChangeRequestService;

    @GetMapping
    public ResponseEntity<List<TeamChangeRequestResponseDTO>> getAllTeamChangeRequests() {
        return ResponseEntity.ok(teamChangeRequestService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamChangeRequestResponseDTO> getTeamChangeRequestById(@PathVariable Integer id) {
        return teamChangeRequestService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<TeamChangeRequestResponseDTO>> getTeamChangeRequestsByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(teamChangeRequestService.findByStudentId(studentId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TeamChangeRequestResponseDTO>> getTeamChangeRequestsByStatus(@PathVariable String status) {
        try {
            com.itmo.programmingclub.model.entity.TeamChangeRequest.RequestStatus statusEnum = 
                    com.itmo.programmingclub.model.entity.TeamChangeRequest.RequestStatus.valueOf(status);
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

    @PostMapping("/curator/move-student")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<Void> moveStudentDirectly(@RequestParam Integer studentUserRoleId,
                                                    @RequestParam Integer toTeamId,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        teamChangeRequestService.moveStudentDirectly(userDetails.getUsername(), studentUserRoleId, toTeamId);
        return ResponseEntity.ok().build();
    }
}

