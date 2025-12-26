package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.entity.ElderChangeRequest;
import com.itmo.programmingclub.service.ElderChangeRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/elder-change-requests")
@RequiredArgsConstructor
public class ElderChangeRequestController {
    private final ElderChangeRequestService elderChangeRequestService;

    @GetMapping
    public ResponseEntity<List<ElderChangeRequest>> getAllElderChangeRequests() {
        return ResponseEntity.ok(elderChangeRequestService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ElderChangeRequest> getElderChangeRequestById(@PathVariable Integer id) {
        return elderChangeRequestService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<ElderChangeRequest>> getElderChangeRequestsByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(elderChangeRequestService.findByStudentId(studentId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ElderChangeRequest>> getElderChangeRequestsByStatus(@PathVariable String status) {
        try {
            ElderChangeRequest.RequestStatus statusEnum = ElderChangeRequest.RequestStatus.valueOf(status);
            return ResponseEntity.ok(elderChangeRequestService.findByStatus(statusEnum));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<ElderChangeRequest> createElderChangeRequest(@RequestBody ElderChangeRequest request) {
        ElderChangeRequest created = elderChangeRequestService.createElderChangeRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ElderChangeRequest> updateElderChangeRequest(@PathVariable Integer id, @RequestBody ElderChangeRequest request) {
        return elderChangeRequestService.findById(id)
                .map(existing -> {
                    request.setId(id);
                    return ResponseEntity.ok(elderChangeRequestService.updateElderChangeRequest(request));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

