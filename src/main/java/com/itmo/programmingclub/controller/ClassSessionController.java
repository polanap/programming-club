package com.itmo.programmingclub.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

import com.itmo.programmingclub.model.dto.SubmissionDTO;
import com.itmo.programmingclub.model.entity.Submission;
import com.itmo.programmingclub.model.entity.Task;
import com.itmo.programmingclub.service.ClassSessionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/class-session")
@RequiredArgsConstructor
public class ClassSessionController {
    private final ClassSessionService classSessionService;

    @PostMapping("/{classId}/join/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> joinClassAsStudent(@PathVariable Integer classId,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        classSessionService.joinClassAsStudent(classId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{classId}/leave/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> leaveClassAsStudent(@PathVariable Integer classId,
                                                     @AuthenticationPrincipal UserDetails userDetails) {
        classSessionService.leaveClassAsStudent(classId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{classId}/join/curator")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<Void> joinClassAsCurator(@PathVariable Integer classId,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        classSessionService.joinClassAsCurator(classId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{classId}/leave/curator")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<Void> leaveClassAsCurator(@PathVariable Integer classId,
                                                     @AuthenticationPrincipal UserDetails userDetails) {
        classSessionService.leaveClassAsCurator(classId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/team/{teamId}/join")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<Void> joinTeamAsCurator(@PathVariable Integer teamId,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        classSessionService.joinTeamAsCurator(teamId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/team/{teamId}/leave")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<Void> leaveTeamAsCurator(@PathVariable Integer teamId,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        classSessionService.leaveTeamAsCurator(teamId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/team/{teamId}/block-submission")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<Void> blockTeamSubmission(@PathVariable Integer teamId,
                                                     @RequestParam boolean blocked,
                                                     @AuthenticationPrincipal UserDetails userDetails) {
        classSessionService.setTeamSubmissionBlocked(teamId, blocked, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/team/{teamId}/toggle-hand")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> toggleHandRaised(@PathVariable Integer teamId,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        classSessionService.toggleHandRaised(teamId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/team/{teamId}/select-task/{taskId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> selectTaskForTeam(@PathVariable Integer teamId,
                                                   @PathVariable Integer taskId,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        classSessionService.selectTaskForTeam(teamId, taskId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/team/{teamId}/submit-solution/{taskId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SubmissionDTO> submitSolution(@PathVariable Integer teamId,
                                                      @PathVariable Integer taskId,
                                                      @RequestBody(required = false) Map<String, String> requestBody,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        String solution = requestBody != null ? requestBody.get("solution") : null;
        String language = requestBody != null ? requestBody.get("language") : "java";
        Submission submission = classSessionService.submitSolution(teamId, taskId, solution, language, userDetails.getUsername());
        return ResponseEntity.ok(SubmissionDTO.fromEntity(submission));
    }

    @GetMapping("/submission/{submissionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SubmissionDTO> getSubmissionStatus(@PathVariable Integer submissionId) {
        return ResponseEntity.ok(classSessionService.getSubmissionDetails(submissionId));
    }

    @GetMapping("/team/{teamId}/submissions")
    @PreAuthorize("hasAnyRole('STUDENT', 'CURATOR')")
    public ResponseEntity<List<SubmissionDTO>> getTeamSubmissions(@PathVariable Integer teamId) {
        return ResponseEntity.ok(classSessionService.getTeamSubmissions(teamId));
    }

    @GetMapping("/team/{teamId}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getTeamStatus(@PathVariable Integer teamId) {
        boolean isBlocked = classSessionService.isTeamBlocked(teamId);
        boolean handRaised = classSessionService.isHandRaised(teamId);
        Optional<Task> selectedTask = classSessionService.getSelectedTaskForTeam(teamId);
        
        Map<String, Object> status = new HashMap<>();
        status.put("isBlocked", isBlocked);
        status.put("handRaised", handRaised);
        status.put("selectedTaskId", selectedTask.map(Task::getId).orElse(null));
        
        return ResponseEntity.ok(status);
    }

    @GetMapping("/team/{teamId}/is-curator-joined")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<Map<String, Boolean>> isCuratorJoinedToTeam(@PathVariable Integer teamId,
                                                                       @AuthenticationPrincipal UserDetails userDetails) {
        boolean isJoined = classSessionService.isCuratorJoinedToTeamByUsername(teamId, userDetails.getUsername());
        Map<String, Boolean> result = new HashMap<>();
        result.put("isJoined", isJoined);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/team/{teamId}/joined-curators")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Integer>> getJoinedCuratorsToTeam(@PathVariable Integer teamId) {
        List<Integer> curatorIds = classSessionService.getJoinedCuratorsToTeam(teamId);
        return ResponseEntity.ok(curatorIds);
    }
}
