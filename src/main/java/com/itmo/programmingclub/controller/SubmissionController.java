package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.mapper.SubmissionMapper;
import com.itmo.programmingclub.model.dto.SubmissionRequestDTO;
import com.itmo.programmingclub.model.dto.SubmissionResponseDTO;
import com.itmo.programmingclub.model.entity.Submission;
import com.itmo.programmingclub.service.CodeExecutionService;
import com.itmo.programmingclub.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;
    private final CodeExecutionService codeExecutionService;
    private final SubmissionMapper submissionMapper;

    @PostMapping("/submit/{taskId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SubmissionResponseDTO> submitSolution(@PathVariable Integer taskId,
                                                                @Valid @RequestBody SubmissionRequestDTO requestDTO,
                                                                @AuthenticationPrincipal UserDetails userDetails) {

        Submission submission = submissionService.createSubmission(taskId, requestDTO, userDetails.getUsername());

        codeExecutionService.executeSubmission(submission.getId());

        return ResponseEntity.accepted().body(submissionMapper.toDto(submission));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SubmissionResponseDTO> getSubmissionById(@PathVariable Integer id) {
        Submission submission = submissionService.findById(id);
        return ResponseEntity.ok(submissionMapper.toDto(submission));
    }
}