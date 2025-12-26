package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.entity.Submission;
import com.itmo.programmingclub.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {
    private final SubmissionService submissionService;

    @GetMapping
    public ResponseEntity<List<Submission>> getAllSubmissions() {
        return ResponseEntity.ok(submissionService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Submission> getSubmissionById(@PathVariable Integer id) {
        return submissionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<Submission>> getSubmissionsByTeam(@PathVariable Integer teamId) {
        return ResponseEntity.ok(submissionService.findByTeamId(teamId));
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<Submission>> getSubmissionsByTask(@PathVariable Integer taskId) {
        return ResponseEntity.ok(submissionService.findByTaskId(taskId));
    }

    @PostMapping
    public ResponseEntity<Submission> createSubmission(@RequestBody Submission submission) {
        Submission created = submissionService.createSubmission(submission);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Submission> updateSubmission(@PathVariable Integer id, @RequestBody Submission submission) {
        return submissionService.findById(id)
                .map(existing -> {
                    submission.setId(id);
                    return ResponseEntity.ok(submissionService.updateSubmission(submission));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

