package com.itmo.programmingclub.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.itmo.programmingclub.model.dto.InactiveManagerResponse;
import com.itmo.programmingclub.service.ManagerActivationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/managers")
@PreAuthorize("hasRole('MANAGER')")
@RequiredArgsConstructor
public class ManagerController {
    private final ManagerActivationService managerActivationService;

    @GetMapping("/inactive")
    public ResponseEntity<Page<InactiveManagerResponse>> getInactiveManagers(Pageable pageable) {
        Page<InactiveManagerResponse> inactiveManagers = managerActivationService.getInactiveManagers(pageable);
        return ResponseEntity.ok(inactiveManagers);
    }

    @PostMapping("/{userId}/activate")
    public ResponseEntity<Void> activateManager(@PathVariable Integer userId) {
        managerActivationService.activateManager(userId);
        return ResponseEntity.ok().build();
    }
}
