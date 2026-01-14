package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.mapper.TeamMapper;
import com.itmo.programmingclub.model.dto.TeamResponseDTO;
import com.itmo.programmingclub.model.entity.Team;
import com.itmo.programmingclub.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {
    private final TeamService teamService;
    private final TeamMapper teamMapper;

    @GetMapping
    public ResponseEntity<List<Team>> getAllTeams() {
        return ResponseEntity.ok(teamService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Team> getTeamById(@PathVariable Integer id) {
        return teamService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TeamResponseDTO>> getTeamsByClass(@PathVariable Integer classId) {
        List<TeamResponseDTO> teams = teamService.findByClassId(classId).stream()
                .map(teamMapper::toDto)
                .toList();
        return ResponseEntity.ok(teams);
    }

    @PostMapping
    public ResponseEntity<Team> createTeam(@RequestBody Team team) {
        Team created = teamService.createTeam(team);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Team> updateTeam(@PathVariable Integer id, @RequestBody Team team) {
        return teamService.findById(id)
                .map(existing -> {
                    team.setId(id);
                    return ResponseEntity.ok(teamService.updateTeam(team));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Integer id) {
        if (teamService.findById(id).isPresent()) {
            teamService.deleteTeam(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

