package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.model.dto.ElderChangeRequestDTO;
import com.itmo.programmingclub.model.entity.ElderChangeRequest;
import com.itmo.programmingclub.service.ElderChangeRequestService;
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
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> createRequest(@Valid @RequestBody ElderChangeRequestDTO dto,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        elderChangeRequestService.createElderChangeRequest(userDetails.getUsername(), dto);
        return ResponseEntity.ok().build();
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

