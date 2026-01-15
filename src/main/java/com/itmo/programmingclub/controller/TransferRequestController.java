package com.itmo.programmingclub.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.itmo.programmingclub.exceptions.UnauthorizedException;
import com.itmo.programmingclub.model.TransferRequestStatus;
import com.itmo.programmingclub.model.dto.AddAvailableGroupsDTO;
import com.itmo.programmingclub.model.dto.CreateTransferRequestDTO;
import com.itmo.programmingclub.model.dto.CuratorCommentDTO;
import com.itmo.programmingclub.model.dto.RequestClarificationDTO;
import com.itmo.programmingclub.model.dto.SelectGroupDTO;
import com.itmo.programmingclub.model.dto.TransferRequestDTO;
import com.itmo.programmingclub.security.CustomUserDetails;
import com.itmo.programmingclub.security.SecurityUtils;
import com.itmo.programmingclub.service.TransferRequestService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/transfer-request")
@RequiredArgsConstructor
public class TransferRequestController {
    private final TransferRequestService transferRequestService;

    // Common endpoints
    @GetMapping
    public ResponseEntity<List<TransferRequestDTO>> getAllTransferRequests() {
        return ResponseEntity.ok(transferRequestService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransferRequestDTO> getTransferRequestById(@PathVariable Integer id) {
        return ResponseEntity.ok(transferRequestService.findByIdDTO(id));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TransferRequestDTO>> getTransferRequestsByStatus(@PathVariable TransferRequestStatus status) {
        return ResponseEntity.ok(transferRequestService.findByStatus(status));
    }

    @PostMapping("/status/{status}")
    public ResponseEntity<TransferRequestDTO> changeTransferRequestStatus(
            @PathVariable TransferRequestStatus status, 
            @RequestParam Integer requestId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.changeStatus(status, requestId, currentUser.getUserId()));
    }

    // Student endpoints
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TransferRequestDTO> createNewTransferRequest(
            @Valid @RequestBody CreateTransferRequestDTO dto) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        TransferRequestDTO created = transferRequestService.createNewTransferRequest(dto, currentUser.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<TransferRequestDTO>> getMyTransferRequests() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.findByStudentId(currentUser.getUserId()));
    }

    @PostMapping("/{id}/select-group")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TransferRequestDTO> selectGroup(
            @PathVariable Integer id,
            @Valid @RequestBody SelectGroupDTO dto) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.selectGroup(id, dto, currentUser.getUserId()));
    }

    @PostMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TransferRequestDTO> withdrawRequest(@PathVariable Integer id) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.withdrawRequest(id, currentUser.getUserId()));
    }

    // Manager endpoints
    @GetMapping("/unassigned")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TransferRequestDTO>> getUnassignedRequests() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.findUnassignedRequests());
    }

    @PostMapping("/{id}/take")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TransferRequestDTO> takeRequest(@PathVariable Integer id) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.takeRequest(id, currentUser.getUserId()));
    }

    @GetMapping("/my-manager")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TransferRequestDTO>> getMyManagerRequests() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.findByManagerId(currentUser.getUserId()));
    }

    @PostMapping("/{id}/request-clarification")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TransferRequestDTO> requestCuratorClarification(
            @PathVariable Integer id,
            @Valid @RequestBody RequestClarificationDTO dto) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.requestCuratorClarification(id, dto, currentUser.getUserId()));
    }

    @PostMapping("/add-groups")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TransferRequestDTO> addAvailableGroups(
            @Valid @RequestBody AddAvailableGroupsDTO dto) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.addAvailableGroups(dto, currentUser.getUserId()));
    }

    @GetMapping("/{id}/curators")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<com.itmo.programmingclub.model.dto.UserRoleDTO>> getGroupCurators(@PathVariable Integer id) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.getGroupCurators(id, currentUser.getUserId()));
    }

    // Curator endpoints
    @GetMapping("/curator/my")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<List<TransferRequestDTO>> getMyCuratorRequests() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.findByCuratorId(currentUser.getUserId()));
    }

    @GetMapping("/curator/pending")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<List<TransferRequestDTO>> getCuratorPendingRequests() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.findCuratorRequestsForClarification(currentUser.getUserId()));
    }

    @PostMapping("/{id}/curator-comment")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<TransferRequestDTO> addCuratorComment(
            @PathVariable Integer id,
            @Valid @RequestBody CuratorCommentDTO dto) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(transferRequestService.addCuratorComment(id, dto, currentUser.getUserId()));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TransferRequestDTO>> getTransferRequestsByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(transferRequestService.findByStudentId(studentId));
    }

    @GetMapping("/manager/{managerId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TransferRequestDTO>> getTransferRequestsByManager(@PathVariable Integer managerId) {
        return ResponseEntity.ok(transferRequestService.findByManagerId(managerId));
    }
}

