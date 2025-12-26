package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.model.entity.TransferRequest;
import com.itmo.programmingclub.service.TransferRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transfer-requests")
@RequiredArgsConstructor
public class TransferRequestController {
    private final TransferRequestService transferRequestService;

    @GetMapping
    public ResponseEntity<List<TransferRequest>> getAllTransferRequests() {
        return ResponseEntity.ok(transferRequestService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransferRequest> getTransferRequestById(@PathVariable Integer id) {
        return transferRequestService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<TransferRequest>> getTransferRequestsByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(transferRequestService.findByStudentId(studentId));
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<TransferRequest>> getTransferRequestsByManager(@PathVariable Integer managerId) {
        return ResponseEntity.ok(transferRequestService.findByManagerId(managerId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TransferRequest>> getTransferRequestsByStatus(@PathVariable String status) {
        try {
            TransferRequest.TransferRequestStatus statusEnum = TransferRequest.TransferRequestStatus.valueOf(status);
            return ResponseEntity.ok(transferRequestService.findByStatus(statusEnum));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<TransferRequest> createTransferRequest(@RequestBody TransferRequest request) {
        TransferRequest created = transferRequestService.createTransferRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransferRequest> updateTransferRequest(@PathVariable Integer id, @RequestBody TransferRequest request) {
        return transferRequestService.findById(id)
                .map(existing -> {
                    request.setId(id);
                    return ResponseEntity.ok(transferRequestService.updateTransferRequest(request));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

